import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { readCallControlAppId } from '@/lib/telephony/telnyx/env';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import {
  answerCall,
  bridgeCalls,
  hangupProviderCall,
} from '@/lib/telephony/telnyx/outbound';
import { startCallRecording } from '@/lib/telephony/telnyx/recording';
import { resolveAgentSipUri } from '@/lib/telephony/telnyx/agent-sip';
import { listRingableAgents } from '@/lib/telephony/telnyx/inbound';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';
import type { ResolvedNumberRouting } from '@/lib/voice/phone-number-settings';
import type { InboundRoutingContext } from './inbound-router';
import { sendInboundCallPush } from '@/lib/push/send';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';

// ─── Cloud-first inbound hunt ────────────────────────────────────────────────
// Enterprise inbound design: the caller leg is answered in the cloud the moment
// the call arrives, so the caller is always held on reliable cloud media (never
// dead air, never endless ringback) while we hunt the agent:
//
//   browser (WebRTC/SIP dial, ~15s) -> mobile (PSTN dial, ~8s) -> voicemail
//
// Event-driven: each phase dials and returns immediately. Telnyx webhooks drive
// transitions — leg answered -> bridge, leg hangup/timeout -> next phase.
// Phase claims use compare-and-set on hunt_step, so concurrent advancers
// (webhook, decline API, cron sweep) can never double-dial or double-bridge.
//
// Hunt steps: browser -> browser_active -> mobile -> mobile_active ->
//             voicemail -> voicemail_active -> done

/** Spoken to the caller the instant we anchor their leg in the cloud. */
export const CLOUD_ANSWER_GREETING =
  'Thanks for calling GrowthDialer. Please hold while we connect you to our team.';

/** Logged when no mobile fallback is configured — the phase is skipped, never invented. */
export const MOBILE_FALLBACK_NOT_CONFIGURED = 'MOBILE_FALLBACK_NOT_CONFIGURED';

/** Set to 'false' to fall back to the legacy browser-transfer inbound flow. */
export function isCloudFirstEnabled(): boolean {
  return process.env.INBOUND_CLOUD_FIRST !== 'false';
}

const BROWSER_HUNT_MS = 15_000;
const MOBILE_HUNT_MS = 8_000;
const BRIDGE_WAIT_MS = 10_000;
const LEG_B_POLL_MS = 500;
const MEDIA_WATCHDOG_MS = 45_000;

export type HuntStep =
  | 'browser'
  | 'browser_active'
  | 'mobile'
  | 'mobile_active'
  | 'voicemail'
  | 'voicemail_active'
  | 'done';

type HuntPhase = 'browser' | 'mobile' | 'voicemail';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setCallStatus(
  supabase: SupabaseClient,
  callsRowId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from('calls').update(patch).eq('id', callsRowId);
}

// ─── Agent voice presence (single home; used by legacy ring flow too) ───────

/**
 * Freshness window for agent presence heartbeats.
 * Mirrors RINGABLE_HEARTBEAT_MS in inbound.ts and the 25s heartbeat cadence in
 * hooks/use-voice-presence.ts (a missed heartbeat or two still counts as fresh).
 */
const VOICE_PRESENCE_FRESH_MS = 45_000;

/**
 * True when the agent's browser voice node is actually registered and recently
 * heard from. Strict gate before dialing an agent's SIP credential: dialing an
 * unregistered node can never produce media.
 */
export async function isAgentVoiceRegistered(
  supabase: SupabaseClient,
  agentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('agent_presence')
    .select('status, device_state, last_heartbeat_at')
    .eq('agent_id', agentId)
    .order('last_heartbeat_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;
  if ((data.status as string) === 'offline') return false;

  const heartbeatAt = new Date(data.last_heartbeat_at as string).getTime();
  if (!Number.isFinite(heartbeatAt) || Date.now() - heartbeatAt > VOICE_PRESENCE_FRESH_MS) {
    return false;
  }

  const deviceState = data.device_state as string | null;
  return deviceState === 'registered' || deviceState === 'registering';
}

// ─── Voicemail (single home; used by legacy routing too) ─────────────────────

/** Speak text on a call via Call Control (payload + voice are the required params). */
async function speakText(callControlId: string, text: string): Promise<boolean> {
  try {
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/speak`,
      {
        method: 'POST',
        body: JSON.stringify({ payload: text, voice: 'female' }),
      },
    );
    return true;
  } catch (err) {
    console.error('[INBOUND-VM] speak failed:', err);
    return false;
  }
}

/**
 * Public URL of the looping hold-music bed. Telnyx fetches it server-side,
 * so only a public HTTPS app URL qualifies — local dev is skipped silently.
 */
function holdAudioUrl(): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
  if (!base || !/^https:\/\//i.test(base)) return null;
  return `${base}/audio/inbound-hold.mp3`;
}

async function startHoldAudioLoop(callControlId: string): Promise<boolean> {
  const audioUrl = holdAudioUrl();
  if (!audioUrl) {
    console.warn('[CLOUD-HUNT] hold audio skipped — no public HTTPS app URL configured');
    return false;
  }
  try {
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/playback_start`,
      {
        method: 'POST',
        body: JSON.stringify({ audio_url: audioUrl, loop: 'infinity' }),
      },
    );
    console.log('[CLOUD-HUNT] hold audio loop started:', callControlId);
    return true;
  } catch (err) {
    console.error('[CLOUD-HUNT] hold audio start failed:', err);
    return false;
  }
}

async function stopHoldAudio(callControlId: string): Promise<void> {
  try {
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/playback_stop`,
      { method: 'POST', body: JSON.stringify({}) },
    );
  } catch {
    // Best effort — no playback running is fine.
  }
}

interface HuntAudioRow {
  id: string;
  status: string | null;
  direction: string | null;
  telnyx_call_id: string | null;
  cloud_anchored_at: string | null;
  hunt_step: string | null;
}

/** The call row when this control id is the cloud-anchored caller leg. */
async function getHuntingCallerRow(
  supabase: SupabaseClient,
  callerCallControlId: string,
): Promise<HuntAudioRow | null> {
  const { data } = await supabase
    .from('calls')
    .select('id, status, direction, telnyx_call_id, cloud_anchored_at, hunt_step')
    .eq('telnyx_call_id', callerCallControlId)
    .eq('direction', 'inbound')
    .maybeSingle();
  const row = data as HuntAudioRow | null;
  if (!row?.cloud_anchored_at) return null;
  if (row.status !== 'ringing') return null;
  const step = row.hunt_step as string | null;
  if (step !== 'browser' && step !== 'mobile') return null;
  return row;
}

/**
 * Idempotent start of the looping hold-music bed on the caller leg. Driven
 * by the greeting's `call.speak.ended` webhook (so music starts exactly when
 * the greeting finishes) and as a backstop when the mobile phase begins. The
 * call_events marker guarantees a single start per hunt.
 */
export async function ensureHoldAudio(
  supabase: SupabaseClient,
  callerCallControlId: string,
): Promise<void> {
  const row = await getHuntingCallerRow(supabase, callerCallControlId);
  if (!row) return;

  const { data: marker } = await supabase
    .from('call_events')
    .select('id')
    .eq('call_control_id', callerCallControlId)
    .eq('event_type', 'hold_audio')
    .limit(1);
  if (marker?.length) return;

  if (await startHoldAudioLoop(callerCallControlId)) {
    await logInboundCallStep(supabase, callerCallControlId, 'hold_audio');
  }
}

/**
 * Backstop for `call.playback.ended` mid-hunt: if we started a hold loop for
 * this hunt but it ended (interrupted), restart it — unless we recently
 * (re)started, which guards against a tight restart loop when Telnyx keeps
 * failing the playback.
 */
export async function restartHoldAudioIfHunting(
  supabase: SupabaseClient,
  callerCallControlId: string,
): Promise<void> {
  const row = await getHuntingCallerRow(supabase, callerCallControlId);
  if (!row) return;

  const { data: started } = await supabase
    .from('call_events')
    .select('id')
    .eq('call_control_id', callerCallControlId)
    .eq('event_type', 'hold_audio')
    .limit(1);
  if (!started?.length) return;

  const { data: last } = await supabase
    .from('call_events')
    .select('received_at')
    .eq('call_control_id', callerCallControlId)
    .in('event_type', ['hold_audio', 'hold_audio_restart'])
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastAt = last?.received_at ? new Date(last.received_at as string).getTime() : 0;
  if (Number.isFinite(lastAt) && Date.now() - lastAt < 10_000) return;

  if (await startHoldAudioLoop(callerCallControlId)) {
    await logInboundCallStep(supabase, callerCallControlId, 'hold_audio_restart');
  }
}

/** Play a remote audio file on a call (used for a custom voicemail greeting URL). */
async function playGreetingAudioUrl(callControlId: string, audioUrl: string): Promise<boolean> {
  try {
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/playback_start`,
      {
        method: 'POST',
        body: JSON.stringify({ audio_url: audioUrl }),
      },
    );
    return true;
  } catch (err) {
    console.error('[INBOUND-VM] greeting playback failed:', err);
    return false;
  }
}

interface VoicemailGreeting {
  text?: string;
  url?: string;
}

/**
 * Resolve the voicemail greeting for a number. Probes phone_number_settings for
 * an optional custom greeting (voicemail_greeting_text / voicemail_greeting_url
 * columns, when present); falls back to the generic spoken greeting.
 */
async function resolveVoicemailGreeting(
  supabase: SupabaseClient,
  purchasedNumberId: string | undefined,
): Promise<VoicemailGreeting> {
  if (!purchasedNumberId) return {};
  const { data } = await supabase
    .from('phone_number_settings')
    .select('*')
    .eq('purchased_number_id', purchasedNumberId)
    .maybeSingle();
  const row = data as Record<string, unknown> | null;
  const text = typeof row?.voicemail_greeting_text === 'string'
    && row.voicemail_greeting_text.trim()
    ? row.voicemail_greeting_text.trim()
    : undefined;
  const url = typeof row?.voicemail_greeting_url === 'string'
    && row.voicemail_greeting_url.trim()
    ? row.voicemail_greeting_url.trim()
    : undefined;
  return { text, url };
}

const DEFAULT_VOICEMAIL_GREETING =
  "You've reached us. Please leave a message after the tone.";

/**
 * Estimate how long a TTS greeting takes to play so the recording (and its
 * beep) can start after the greeting finishes instead of mid-sentence.
 * Heuristic: English TTS averages ~14 characters/second (roughly 850
 * chars/min). Clamped to [3s, 30s] so a huge custom greeting can't hold the
 * worker open indefinitely.
 */
function greetingPlaybackWaitMs(text: string): number {
  const estimated = Math.ceil(text.length / 14) * 1000;
  return Math.min(30_000, Math.max(3_000, estimated));
}

export async function routeToVoicemail(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
  reason: string,
  opts?: { alreadyAnswered?: boolean },
): Promise<void> {
  console.log('[INBOUND-ROUTE] voicemail', { reason, session: ctx.callSessionId });

  // In the cloud-first hunt the caller leg is already answered in the cloud —
  // answering again would fail, so skip straight to the greeting.
  if (!opts?.alreadyAnswered) {
    await answerCall(ctx.providerCallId);
  } else {
    // Cloud hunt: stop the hold-music bed before the voicemail greeting.
    await stopHoldAudio(ctx.providerCallId);
  }

  // Play the greeting first so the caller hears something human instead of
  // answer-then-silence. Recording (with its beep) starts after the greeting
  // finishes so the beep doesn't cut the greeting off.
  const greeting = await resolveVoicemailGreeting(supabase, ctx.purchasedNumberId);
  if (greeting.url) {
    if (await playGreetingAudioUrl(ctx.providerCallId, greeting.url)) {
      // A remote recording's duration is unknown — allow a generous fixed
      // window so a normal-length greeting finishes before we record.
      await sleep(20_000);
    }
  } else {
    const greetingText = greeting.text ?? DEFAULT_VOICEMAIL_GREETING;
    if (await speakText(ctx.providerCallId, greetingText)) {
      await sleep(greetingPlaybackWaitMs(greetingText));
    }
  }

  await startCallRecording(ctx.providerCallId, {
    format: 'mp3',
    channels: routing.inbound_mode === 'voicemail' ? 'single' : 'dual',
    playBeep: routing.inbound_mode === 'voicemail',
  });
  await setCallStatus(supabase, ctx.callsRowId, {
    status: 'voicemail',
    disposition: 'voicemail',
  });
}

// ─── Hunt state machine ──────────────────────────────────────────────────────

interface HuntRow {
  id: string;
  status: string | null;
  cloud_anchored_at: string | null;
  hunt_step: string | null;
}

async function getHuntRow(
  supabase: SupabaseClient,
  callsRowId: string,
): Promise<HuntRow | null> {
  const { data } = await supabase
    .from('calls')
    .select('id, status, cloud_anchored_at, hunt_step')
    .eq('id', callsRowId)
    .maybeSingle();
  return (data as HuntRow | null) ?? null;
}

/**
 * Compare-and-set on hunt_step: only the winner runs the transition.
 * This is what keeps concurrent advancers (leg-B hangup webhook, decline API,
 * cron sweep, dial-failure path) from double-dialing or double-bridging.
 */
async function transitionHuntStep(
  supabase: SupabaseClient,
  callsRowId: string,
  from: HuntStep | null,
  to: HuntStep,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('calls')
    .update({ hunt_step: to })
    .eq('id', callsRowId)
    .eq('hunt_step', from)
    .select('id');
  if (error) {
    console.error('[CLOUD-HUNT] hunt_step CAS failed:', error.message);
    return false;
  }
  const won = (data?.length ?? 0) > 0;
  if (won) console.log('[CLOUD-HUNT] step', { from, to });
  return won;
}

/** Best-effort cancel of an in-flight hunt leg before moving to the next phase. */
async function cancelInFlightLegB(
  supabase: SupabaseClient,
  callsRowId: string,
): Promise<void> {
  const { data } = await supabase
    .from('calls')
    .select('leg_b_status, leg_b_call_control_id')
    .eq('id', callsRowId)
    .maybeSingle();
  const status = data?.leg_b_status as string | undefined;
  const controlId = data?.leg_b_call_control_id as string | undefined;
  if (controlId && (status === 'initiated' || status === 'ringing')) {
    try {
      await hangupProviderCall(controlId);
    } catch {
      // Best effort — the leg may already be gone.
    }
    await setCallStatus(supabase, callsRowId, { leg_b_status: 'hungup' });
  }
}

/** Split the configured ring budget across hunt phases (browser ~60%). */
function computeHuntBudgets(ringSeconds: number): { browserMs: number; mobileMs: number } {
  const totalMs = Math.min(120, Math.max(10, ringSeconds)) * 1000;
  const browserMs = Math.min(BROWSER_HUNT_MS, Math.floor(totalMs * 0.6));
  const mobileMs = Math.min(MOBILE_HUNT_MS, Math.max(0, totalMs - browserMs - 3_000));
  return { browserMs, mobileMs };
}

/** Prefer the number owner, else the first ringable agent. */
async function pickHuntAgent(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
): Promise<string | null> {
  if (!ctx.workspaceId) return ctx.ownerUserId;
  const candidates = await listRingableAgents(supabase, ctx.workspaceId);
  if (candidates.includes(ctx.ownerUserId)) return ctx.ownerUserId;
  return candidates[0] ?? ctx.ownerUserId;
}

/**
 * Originate a hunt leg as a standalone Call Control call. Tagged with
 * gd_inbound_leg_b so webhooks attribute it to the inbound hunt without
 * creating a customer-facing calls row. Returns the leg's call_control_id,
 * or null when the dial failed.
 */
async function dialHuntLeg(params: {
  to: string;
  from: string;
  timeoutSecs: number;
  clientState: Record<string, unknown>;
}): Promise<string | null> {
  const appId = readCallControlAppId();
  const webhookUrl = resolveVoiceWebhookUrl();
  if (!appId || !webhookUrl) {
    console.error('[CLOUD-HUNT] dial misconfigured (call control app / webhook url)');
    return null;
  }

  try {
    const res = await telephonyRequest<{ data?: { call_control_id?: string } }>(
      '/calls',
      {
        method: 'POST',
        body: JSON.stringify({
          connection_id: appId,
          to: params.to,
          from: params.from,
          webhook_url: webhookUrl,
          webhook_url_method: 'POST',
          webhook_api_version: '2',
          timeout_secs: params.timeoutSecs,
          client_state: Buffer.from(JSON.stringify(params.clientState)).toString('base64'),
        }),
      },
    );
    const callControlId = res.data?.call_control_id ?? null;
    if (!callControlId) {
      console.error('[CLOUD-HUNT] dial returned no call_control_id for', params.to);
    }
    return callControlId;
  } catch (err) {
    console.error('[CLOUD-HUNT] dial failed:', params.to, err);
    return null;
  }
}

/**
 * Start one hunt phase: claim it (CAS), dial the leg, record state, return.
 * Event-driven — the phase does NOT block waiting. Telnyx webhooks drive what
 * happens next: leg answered -> onHuntLegAnswered (bridge), leg hangup/timeout
 * -> advanceCloudHunt (next phase). Dial failures advance immediately.
 */
export async function startHuntPhase(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
  phase: HuntPhase,
): Promise<void> {
  const row = await getHuntRow(supabase, ctx.callsRowId);
  if (!row || row.status !== 'ringing' || !row.cloud_anchored_at) return;

  const activeStep = `${phase}_active` as HuntStep;
  if (!(await transitionHuntStep(supabase, ctx.callsRowId, phase, activeStep))) {
    return; // already claimed or moved on
  }

  if (phase === 'voicemail') {
    await routeToVoicemail(supabase, ctx, routing, 'hunt', { alreadyAnswered: true });
    await transitionHuntStep(supabase, ctx.callsRowId, activeStep, 'done');
    return;
  }

  // Backstop: if the greeting's speak.ended never fired (lost webhook), the
  // hold loop may not be running — ensure it now that we're into the mobile
  // phase. The browser phase is skipped deliberately: the greeting is still
  // playing then and starting music would talk over it.
  if (phase === 'mobile') {
    await ensureHoldAudio(supabase, ctx.providerCallId).catch(() => undefined);
  }

  const { browserMs, mobileMs } = computeHuntBudgets(routing.inbound_ring_seconds);
  const budgetMs = phase === 'browser' ? browserMs : mobileMs;

  let to: string | null = null;
  let agentId: string | null = null;

  if (phase === 'browser') {
    agentId = await pickHuntAgent(supabase, ctx);
    let registered = agentId ? await isAgentVoiceRegistered(supabase, agentId) : false;
    if (agentId && !registered) {
      // Patience before skipping: the browser may be mid-reconnect (socket
      // drop, tab just became visible). Give it one short grace window before
      // giving up on the browser phase — otherwise the user sees a ringing
      // popup whose Accept button can never work (no browser leg dialed).
      console.log('[CLOUD-HUNT] browser not registered yet — waiting 5s and re-checking', {
        agent_id: agentId,
        session: ctx.callSessionId,
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
      registered = await isAgentVoiceRegistered(supabase, agentId);
    }
    if (agentId && registered) {
      const sip = await resolveAgentSipUri(supabase, agentId);
      if (sip) {
        to = sip.sipUri;
      } else {
        console.warn('[CLOUD-HUNT] no SIP credential for agent — skip browser phase', {
          agent_id: agentId,
          session: ctx.callSessionId,
        });
      }
    } else {
      console.warn('[CLOUD-HUNT] no registered browser agent — skip browser phase', {
        session: ctx.callSessionId,
      });
    }
  } else {
    const mobile = normalizeE164(routing.inbound_forward_number ?? '');
    if (mobile) {
      to = mobile;
      agentId = ctx.ownerUserId;
      console.log('[CLOUD-HUNT] dialing mobile fallback', { session: ctx.callSessionId });
    } else {
      console.log('[CLOUD-HUNT] skipping mobile phase:', MOBILE_FALLBACK_NOT_CONFIGURED);
    }
  }

  if (!to || !agentId) {
    await advanceCloudHunt(supabase, ctx, routing, `${phase}_unavailable`);
    return;
  }

  const legControlId = await dialHuntLeg({
    to,
    from: ctx.toNumber,
    timeoutSecs: Math.max(5, Math.ceil(budgetMs / 1000)),
    clientState: {
      gd_inbound_leg_b: true,
      telnyx_session_id: ctx.callSessionId,
      agent_id: agentId,
      gd_hunt_phase: phase,
      gd_from_number: ctx.fromNumber ?? '',
      gd_to_number: ctx.toNumber,
    },
  });

  if (!legControlId) {
    await advanceCloudHunt(supabase, ctx, routing, `${phase}_dial_failed`);
    return;
  }

  // Point the realtime popup + accept flow at the hunted agent.
  await setCallStatus(supabase, ctx.callsRowId, {
    user_id: agentId,
    leg_b_status: 'initiated',
    leg_b_call_control_id: legControlId,
  });
  console.log('[CLOUD-HUNT] leg dialed', {
    phase,
    agent: agentId,
    session: ctx.callSessionId,
  });
  // The hunt now waits on webhooks: leg answered -> bridge, leg hangup -> next phase.
}

/**
 * Advance the hunt exactly one phase. Called by the leg-B hangup webhook, the
 * decline API, the cron sweep, and dial-failure paths. Compare-and-set keeps
 * concurrent advancers from running the same phase twice.
 */
export async function advanceCloudHunt(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
  reason: string,
): Promise<void> {
  const row = await getHuntRow(supabase, ctx.callsRowId);
  if (!row || row.status !== 'ringing' || !row.cloud_anchored_at) return;
  const step = row.hunt_step as HuntStep | null;

  // Unclaimed phase (e.g. reset after a bridge failure, or a claimer that died
  // between setting and claiming) — (re)start it; startHuntPhase claims it.
  if (step === 'browser' || step === 'mobile' || step === 'voicemail') {
    console.log('[CLOUD-HUNT] (re)starting unclaimed phase', { step, reason });
    await startHuntPhase(supabase, ctx, routing, step);
    return;
  }

  const next: HuntStep | null =
    step === 'browser_active' ? 'mobile'
    : step === 'mobile_active' ? 'voicemail'
    : null;
  if (!next) return;

  await cancelInFlightLegB(supabase, ctx.callsRowId);
  if (!(await transitionHuntStep(supabase, ctx.callsRowId, step, next))) return;
  console.log('[CLOUD-HUNT] advance', {
    reason,
    from: step,
    to: next,
    session: ctx.callSessionId,
  });
  await startHuntPhase(supabase, ctx, routing, next as HuntPhase);
}

interface AnsweredHuntRow {
  id: string;
  status: string | null;
  telnyx_call_id: string | null;
  to_number: string | null;
  from_number: string | null;
  user_id: string | null;
  cloud_anchored_at: string | null;
  hunt_step: string | null;
}

/**
 * Called from the voice webhook when a hunt leg (browser or mobile) answers.
 * Claims the bridge with compare-and-set — only the first answered leg wins —
 * then joins the agent leg to the anchored caller leg.
 *
 * Returns true when the event was consumed by a cloud hunt (bridged, or the
 * hunt was already resolved elsewhere); false when this isn't a cloud-anchored
 * call and the legacy flow should continue.
 */
export async function onHuntLegAnswered(
  supabase: SupabaseClient,
  telnyxSessionId: string,
  legControlId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('calls')
    .select('id, status, telnyx_call_id, to_number, from_number, user_id, cloud_anchored_at, hunt_step')
    .eq('telnyx_session_id', telnyxSessionId)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = (data as AnsweredHuntRow | null) ?? null;
  if (!row || !row.cloud_anchored_at) return false;
  if (row.status !== 'ringing') return true; // hunt not active — nothing to do

  const step = row.hunt_step as HuntStep | null;
  if (step !== 'browser_active' && step !== 'mobile_active') {
    // Stale leg answered after the hunt moved on (bridged, voicemail, or
    // superseded) — hang it up so it can't inject audio into the call or
    // dangle on a channel.
    try {
      await hangupProviderCall(legControlId);
    } catch {
      // Best effort.
    }
    return true;
  }

  // Claim the bridge — only the first answered leg wins.
  if (!(await transitionHuntStep(supabase, row.id, step, 'done'))) return true;

  const callerLegId = row.telnyx_call_id;
  if (!callerLegId) {
    console.error('[CLOUD-HUNT] bridge impossible — caller leg id missing', { session: telnyxSessionId });
    return true;
  }

  // Stop the hold-music bed before joining the legs so it doesn't bleed
  // into the conversation.
  await stopHoldAudio(callerLegId);

  try {
    await bridgeCalls(callerLegId, legControlId);
  } catch (err) {
    console.error('[CLOUD-HUNT] bridge failed:', err);
    // The agent answered but the join failed — hang up their leg and keep
    // hunting so the caller isn't stranded; the next phase still serves them.
    try {
      await hangupProviderCall(legControlId);
    } catch {
      // Best effort.
    }
    const fallback: HuntStep = step === 'browser_active' ? 'mobile' : 'voicemail';
    await transitionHuntStep(supabase, row.id, 'done', fallback);
    const { advanceInboundRingGroup } = await import('./inbound-router');
    await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_unreachable');
    return true;
  }

  console.log('[CLOUD-HUNT] bridged', {
    phase: step.replace('_active', ''),
    session: telnyxSessionId,
  });

  await setCallStatus(supabase, row.id, {
    status: 'answered',
    answered_at: new Date().toISOString(),
    // Deadline for the first media/bridge confirmation after answer; the
    // webhook work clears it on call.bridged, the cron sweep hangs up
    // answered-but-silent calls past it.
    media_watchdog_deadline: new Date(Date.now() + MEDIA_WATCHDOG_MS).toISOString(),
  });

  // Recording follows the number's setting; the media-plane confirmation
  // (call.bridged) is what clears the watchdog.
  try {
    const { data: numRow } = await supabase
      .from('purchased_numbers')
      .select('user_id, id')
      .eq('phone_number', row.to_number ?? '')
      .neq('status', 'released')
      .limit(1)
      .maybeSingle();
    const ownerId = (numRow?.user_id as string | undefined) ?? row.user_id ?? undefined;
    // Without an owner we can't resolve recording settings — skip recording
    // rather than guess.
    if (!ownerId) {
      console.warn('[CLOUD-HUNT] no owner for recording settings — skipping', {
        session: telnyxSessionId,
      });
    } else {
      const huntRouting = await resolveNumberRouting(
        supabase,
        ownerId,
        (numRow?.id as string | undefined) ?? undefined,
      );
      if (huntRouting.recording_enabled) {
        await startCallRecording(callerLegId, {
          format: 'mp3',
          channels: 'dual',
          playBeep: false,
        });
      }
    }
  } catch (err) {
    console.error('[CLOUD-HUNT] post-bridge recording setup failed:', err);
  }

  return true;
}

/**
 * Cloud-first entry point, called on call.initiated for browser-mode numbers.
 * Answers the caller in the cloud immediately (reliable media from second
 * zero), plays a short greeting, notifies the agent via push, then starts the
 * hunt. Every path ends cleanly — the caller never hears dead air.
 */
export async function runCloudFirstHunt(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
): Promise<void> {
  console.log('[CLOUD-HUNT] start', {
    session: ctx.callSessionId,
    from: ctx.fromNumber,
    to: ctx.toNumber,
  });

  try {
    await answerCall(ctx.providerCallId);
  } catch (err) {
    console.error('[CLOUD-HUNT] cloud answer failed — abandoning hunt:', err);
    try {
      await hangupProviderCall(ctx.providerCallId);
    } catch {
      // Best effort.
    }
    await setCallStatus(supabase, ctx.callsRowId, {
      status: 'missed',
      disposition: 'missed',
      ended_at: new Date().toISOString(),
    });
    return;
  }

  await setCallStatus(supabase, ctx.callsRowId, {
    cloud_anchored_at: new Date().toISOString(),
    hunt_step: 'browser',
  });

  // Greeting plays while the hunt dials — fire and forget, never block the hunt.
  // When it finishes, its call.speak.ended webhook starts the looping hold
  // music; if the greeting itself fails, start hold music immediately so the
  // caller never sits in silence.
  speakText(ctx.providerCallId, CLOUD_ANSWER_GREETING)
    .then((ok) => {
      if (!ok) ensureHoldAudio(supabase, ctx.providerCallId).catch(() => undefined);
    })
    .catch(() => undefined);

  // Push notification so the call surfaces even with the tab closed.
  sendInboundCallPush(supabase, ctx.ownerUserId, ctx.fromNumber).catch(() => undefined);

  await startHuntPhase(supabase, ctx, routing, 'browser');
}

/**
 * Used by the accept API for cloud-anchored calls: the hunt owns bridging, so
 * just wait briefly for it to finish and report honestly.
 */
export async function waitForHuntBridge(
  supabase: SupabaseClient,
  callsRowId: string,
  timeoutMs: number = BRIDGE_WAIT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('calls')
      .select('status, leg_b_status')
      .eq('id', callsRowId)
      .maybeSingle();
    const status = data?.status as string | undefined;
    const legB = data?.leg_b_status as string | undefined;
    if (status === 'answered' || status === 'active' || legB === 'bridged') return true;
    if (
      status === 'voicemail'
      || status === 'missed'
      || status === 'completed'
      || status === 'ended'
    ) {
      return false;
    }
    await sleep(LEG_B_POLL_MS);
  }
  return false;
}
