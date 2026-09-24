import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import {
  resolveNumberRouting,
  type ResolvedNumberRouting,
} from '@/lib/voice/phone-number-settings';
import { resolveAgentSipUri } from '@/lib/telephony/telnyx/agent-sip';
import { listRingableAgents } from '@/lib/telephony/telnyx/inbound';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { answerCall, hangupProviderCall, rejectCall, transferCall } from '@/lib/telephony/telnyx/outbound';
import { startCallRecording } from '@/lib/telephony/telnyx/recording';

export interface InboundRoutingContext {
  providerCallId: string;
  callSessionId: string | null;
  fromNumber: string | null;
  toNumber: string;
  ownerUserId: string;
  workspaceId: string | null;
  purchasedNumberId?: string;
  callsRowId: string;
}

export async function findInboundCallBySession(
  supabase: SupabaseClient,
  telnyxSessionId: string,
) {
  const { data } = await supabase
    .from('calls')
    .select('id, user_id, status, direction, telnyx_call_id, telnyx_webrtc_leg_id, telnyx_session_id, from_number, to_number, answered_at, workspace_id, leg_b_status')
    .eq('telnyx_session_id', telnyxSessionId)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function pickRoundRobinAgent(
  supabase: SupabaseClient,
  workspaceId: string,
  candidates: string[],
): Promise<string | null> {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const { data: lastRouted } = await supabase
    .from('calls')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAgentId = lastRouted?.user_id as string | undefined;
  if (!lastAgentId) return candidates[0];

  const lastIndex = candidates.indexOf(lastAgentId);
  if (lastIndex === -1) return candidates[0];
  return candidates[(lastIndex + 1) % candidates.length];
}

async function upsertInboundCallsRow(
  supabase: SupabaseClient,
  ctx: Omit<InboundRoutingContext, 'callsRowId'> & { leadId: string | null; ringingUserId: string },
): Promise<string | null> {
  if (ctx.callSessionId) {
    const { data: bySession } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_session_id', ctx.callSessionId)
      .eq('direction', 'inbound')
      .maybeSingle();
    if (bySession?.id) return bySession.id;
  }

  const { data: existing } = await supabase
    .from('calls')
    .select('id')
    .eq('telnyx_call_id', ctx.providerCallId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: inserted, error } = await supabase
    .from('calls')
    .insert({
      user_id: ctx.ringingUserId,
      workspace_id: ctx.workspaceId,
      lead_id: ctx.leadId,
      direction: 'inbound',
      telnyx_call_id: ctx.providerCallId,
      telnyx_session_id: ctx.callSessionId,
      from_number: ctx.fromNumber,
      to_number: ctx.toNumber,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[INBOUND-DB] insert failed:', error.message);
    if (ctx.callSessionId) {
      const { data: raced } = await supabase
        .from('calls')
        .select('id')
        .eq('telnyx_session_id', ctx.callSessionId)
        .eq('direction', 'inbound')
        .maybeSingle();
      return raced?.id ?? null;
    }
    const { data: raced } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', ctx.providerCallId)
      .maybeSingle();
    return raced?.id ?? null;
  }

  console.log('[INBOUND-DB-INSERT] call row created', {
    telnyx_session_id: ctx.callSessionId,
    user_id: ctx.ringingUserId,
    status: 'ringing',
    from_number: ctx.fromNumber,
    call_id: inserted?.id,
  });
  return inserted?.id ?? null;
}

async function setCallStatus(
  supabase: SupabaseClient,
  callsRowId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from('calls').update(patch).eq('id', callsRowId);
}

/**
 * Freshness window for agent presence heartbeats.
 * Mirrors RINGABLE_HEARTBEAT_MS in inbound.ts and the 25s heartbeat cadence in
 * hooks/use-voice-presence.ts (a missed heartbeat or two still counts as fresh).
 */
const VOICE_PRESENCE_FRESH_MS = 45_000;

/**
 * True when the agent's browser voice node is actually registered and recently
 * heard from. This is the strict gate used before transferring the PSTN leg to
 * an agent's SIP credential: transferring to an unregistered node makes the
 * caller ring forever with no media on the other side.
 */
async function isAgentVoiceRegistered(
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function routeToVoicemail(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
  reason: string,
): Promise<void> {
  console.log('[INBOUND-ROUTE] voicemail', { reason, session: ctx.callSessionId });
  await answerCall(ctx.providerCallId);

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

async function routeToForward(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
): Promise<void> {
  const forwardTo = normalizeE164(routing.inbound_forward_number ?? '');
  if (!forwardTo) {
    await routeToVoicemail(supabase, ctx, routing, 'forward_number_missing');
    return;
  }

  console.log('[INBOUND-ROUTE] forward', { to: forwardTo, session: ctx.callSessionId });
  await answerCall(ctx.providerCallId);
  await transferCall(ctx.providerCallId, forwardTo);
  await setCallStatus(supabase, ctx.callsRowId, { status: 'forwarded' });
  // Ring-timeout failover is handled by the /api/cron/inbound-health-sweep cron.
}

async function assignInboundRingTarget(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  agentId: string,
  routing: ResolvedNumberRouting,
): Promise<void> {
  await setCallStatus(supabase, ctx.callsRowId, {
    user_id: agentId,
    status: 'ringing',
  });

  console.log('[INBOUND-RING] server popup target', {
    agent_id: agentId,
    session: ctx.callSessionId,
  });
  // Ring-timeout failover is handled by the /api/cron/inbound-health-sweep cron.
}

async function ringCurrentAgent(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  agentId: string,
  routing: ResolvedNumberRouting,
): Promise<boolean> {
  await assignInboundRingTarget(supabase, ctx, agentId, routing);

  const sip = await resolveAgentSipUri(supabase, agentId);
  if (!sip) {
    console.warn('[INBOUND-RING] no SIP credential — server popup only', agentId);
    return true;
  }

  // Presence gate: never transfer the PSTN leg to an agent whose browser voice
  // node isn't registered — the caller would ring forever with no media.
  // Returning false lets the ring group advance to the next agent.
  if (!(await isAgentVoiceRegistered(supabase, agentId))) {
    console.warn('[INBOUND-RING] agent voice node not registered — advance ring group', agentId);
    return false;
  }

  console.log('[INBOUND-RING] transfer to agent', {
    agent_id: agentId,
    session: ctx.callSessionId,
    sip: sip.sipUsername,
  });

  const transferred = await transferCall(ctx.providerCallId, sip.sipUri, ctx.toNumber, {
    gd_inbound_leg_b: true,
    telnyx_session_id: ctx.callSessionId,
    agent_id: agentId,
    gd_from_number: ctx.fromNumber ?? '',
    gd_to_number: ctx.toNumber,
  });

  if (!transferred) {
    console.error('[INBOUND-RING] SIP transfer failed — advance ring group', { agent_id: agentId });
    return false;
  }

  // Leg B (agent) transfer was accepted by the provider. The webhook work
  // advances leg_b_status to ringing/answered/bridged (or failed/hungup);
  // leg_b_call_control_id isn't known until the Leg B webhooks arrive.
  await setCallStatus(supabase, ctx.callsRowId, {
    leg_b_status: 'initiated',
    leg_b_call_control_id: null,
  });

  return true;
}

export async function routeInboundToBrowserAgents(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
): Promise<void> {
  const routing = await resolveNumberRouting(
    supabase,
    ctx.ownerUserId,
    ctx.purchasedNumberId,
  );

  if (!ctx.workspaceId) {
    console.warn('[INBOUND-ROUTE] workspace missing — server popup for number owner');
    await ringCurrentAgent(supabase, ctx, ctx.ownerUserId, routing);
    return;
  }

  const candidates = await listRingableAgents(supabase, ctx.workspaceId);
  const ordered = [
    ...(candidates.includes(ctx.ownerUserId) ? [ctx.ownerUserId] : []),
    ...candidates.filter((id) => id !== ctx.ownerUserId),
  ];

  const pool = ordered.length ? ordered : [ctx.ownerUserId];
  const startAgentId = await pickRoundRobinAgent(supabase, ctx.workspaceId, pool) ?? pool[0];
  const startIndex = pool.indexOf(startAgentId);
  const rotated = [...pool.slice(startIndex), ...pool.slice(0, startIndex)];

  for (const agentId of rotated) {
    const rang = await ringCurrentAgent(supabase, ctx, agentId, routing);
    if (rang) {
      console.log('[INBOUND-ROUTE] browser ring started', { agent_id: agentId });
      return;
    }
  }

  await assignInboundRingTarget(supabase, ctx, ctx.ownerUserId, routing);
  console.log('[INBOUND-ROUTE] fallback server popup for owner', { agent_id: ctx.ownerUserId });
}


export async function advanceInboundRingGroup(
  supabase: SupabaseClient,
  telnyxSessionId: string,
  reason: 'agent_declined' | 'ring_timeout' | 'agent_unreachable',
): Promise<{ ok: boolean; status: string }> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call?.telnyx_call_id) {
    return { ok: false, status: 'not_found' };
  }

  if (call.status !== 'ringing' && call.status !== 'missed') {
    return { ok: false, status: call.status ?? 'unknown' };
  }

  const workspaceId = call.workspace_id as string | null;
  const currentAgentId = call.user_id as string;
  const providerCallId = call.telnyx_call_id as string;

  console.log('[INBOUND-ROUTE] advance ring group', { reason, session: telnyxSessionId });

  if (!workspaceId) {
    await hangupProviderCall(providerCallId);
    await setCallStatus(supabase, call.id, { status: 'missed', disposition: 'missed' });
    return { ok: true, status: 'missed' };
  }

  const { data: ownerNumber } = await supabase
    .from('purchased_numbers')
    .select('user_id, id')
    .eq('phone_number', call.to_number as string)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  const ownerUserId = ownerNumber?.user_id as string | undefined;
  if (!ownerUserId) {
    await hangupProviderCall(providerCallId);
    await setCallStatus(supabase, call.id, { status: 'missed', disposition: 'missed' });
    return { ok: true, status: 'missed' };
  }

  const routing = await resolveNumberRouting(
    supabase,
    ownerUserId,
    ownerNumber?.id as string | undefined,
  );

  const candidates = await listRingableAgents(supabase, workspaceId);
  const ordered = [
    ...(candidates.includes(ownerUserId) ? [ownerUserId] : []),
    ...candidates.filter((id) => id !== ownerUserId),
  ];

  const currentIndex = currentAgentId ? ordered.indexOf(currentAgentId) : -1;
  const remaining = currentIndex >= 0 ? ordered.slice(currentIndex + 1) : ordered;

  const ctx: InboundRoutingContext = {
    providerCallId,
    callSessionId: telnyxSessionId,
    fromNumber: call.from_number as string | null,
    toNumber: call.to_number as string,
    ownerUserId,
    workspaceId,
    purchasedNumberId: ownerNumber?.id as string | undefined,
    callsRowId: call.id,
  };

  for (const agentId of remaining) {
    const rang = await ringCurrentAgent(supabase, ctx, agentId, routing);
    if (rang) return { ok: true, status: 'ringing' };
  }

  if (routing.inbound_forward_number) {
    await routeToForward(supabase, ctx, routing);
    return { ok: true, status: 'forwarded' };
  }

  await routeToVoicemail(supabase, ctx, routing, reason);
  return { ok: true, status: 'voicemail' };
}

/**
 * Poll the calls row until the agent leg (Leg B) is confirmed answered/bridged
 * by the webhook work. Gives up after ~8s — the caller must not hear ringback
 * forever, so a missing bridge means we fail over instead of answering.
 */
async function waitForLegBAnswer(
  supabase: SupabaseClient,
  callsRowId: string,
): Promise<boolean> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('calls')
      .select('leg_b_status')
      .eq('id', callsRowId)
      .maybeSingle();
    const status = (data?.leg_b_status as string | undefined) ?? 'none';
    if (status === 'answered' || status === 'bridged') return true;
    if (status === 'failed' || status === 'hungup') return false; // terminal — don't wait out the clock
    await sleep(400);
  }
  return false;
}

export async function markInboundAccepted(
  supabase: SupabaseClient,
  telnyxSessionId: string,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call) return { ok: false, error: 'not_found' };
  if (call.status === 'active' || call.status === 'answered') return { ok: true };

  const legBStatus = (call.leg_b_status as string | null) ?? 'none';
  const pstnControlId = call.telnyx_call_id as string | null;

  // Dedupe: the ring step already transferred the PSTN leg to the agent's SIP
  // credential (leg_b_status initiated/ringing), so don't transfer a second
  // time. An already-answered/bridged leg needs no transfer either. Only when
  // no transfer is in flight (none, failed, hungup) do we bridge one here.
  const legBInFlight = legBStatus === 'initiated' || legBStatus === 'ringing';
  const legBAlive = legBStatus === 'answered' || legBStatus === 'bridged';
  if (!legBInFlight && !legBAlive) {
    if (!(await isAgentVoiceRegistered(supabase, agentId))) {
      console.warn('[INBOUND-ANSWER] agent voice node not registered — cannot bridge', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      return { ok: false, error: 'voice_not_connected' };
    }

    const sip = await resolveAgentSipUri(supabase, agentId);
    if (!sip || !pstnControlId) {
      console.warn('[INBOUND-ANSWER] no SIP credential or PSTN leg — cannot bridge', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      return { ok: false, error: 'voice_not_connected' };
    }

    console.log('[INBOUND-ANSWER] bridging agent leg on accept (no ring-time transfer)', {
      agent_id: agentId,
      session: telnyxSessionId,
    });
    const transferred = await transferCall(pstnControlId, sip.sipUri, call.to_number as string, {
      gd_inbound_leg_b: true,
      telnyx_session_id: telnyxSessionId,
      agent_id: agentId,
      gd_from_number: (call.from_number as string | null) ?? '',
      gd_to_number: call.to_number as string,
    });

    if (!transferred) {
      console.error('[INBOUND-ANSWER] agent-leg transfer failed', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      await setCallStatus(supabase, call.id, { leg_b_status: 'failed' });
      return { ok: false, error: 'voice_not_connected' };
    }

    await setCallStatus(supabase, call.id, {
      leg_b_status: 'initiated',
      leg_b_call_control_id: null,
    });
  }

  if (!pstnControlId) {
    return { ok: false, error: 'answer_failed' };
  }

  // Only answer the PSTN leg once Leg B is confirmed live — answering before
  // the bridge exists is what produced answered-but-silent calls.
  const legBConfirmed = await waitForLegBAnswer(supabase, call.id);
  if (!legBConfirmed) {
    console.warn('[INBOUND-ANSWER] agent leg never bridged — failing over', {
      session: telnyxSessionId,
    });
    await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_unreachable');
    return { ok: false, error: 'voice_not_connected' };
  }

  try {
    await answerCall(pstnControlId);
  } catch (err) {
    console.error('[INBOUND-ANSWER] PSTN answer failed:', err);
    return { ok: false, error: 'answer_failed' };
  }

  console.log('[INBOUND-ANSWERED]', telnyxSessionId);

  await setCallStatus(supabase, call.id, {
    status: 'answered',
    answered_at: new Date().toISOString(),
    user_id: agentId,
    // Deadline for the first media/bridge confirmation after answer; the
    // webhook work uses it to detect answered-but-silent calls.
    media_watchdog_deadline: new Date(Date.now() + 45_000).toISOString(),
  });

  return { ok: true };
}

export async function markInboundDeclined(
  supabase: SupabaseClient,
  telnyxSessionId: string,
): Promise<void> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call || call.status !== 'ringing') return;

  const webrtcLegId = call.telnyx_webrtc_leg_id as string | null;

  if (webrtcLegId) {
    await rejectCall(webrtcLegId).catch(() => hangupProviderCall(webrtcLegId).catch(() => undefined));
  }

  const result = await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_declined');
  if (result.status !== 'ringing') {
    await supabase
      .from('calls')
      .update({ status: 'missed', disposition: 'declined' })
      .eq('id', call.id);
  }

  console.log('[INBOUND-DECLINED]', telnyxSessionId);
}

export async function handleInboundCallInitiated(
  supabase: SupabaseClient,
  params: {
    providerCallId: string;
    callSessionId?: string;
    fromNumber: string | null;
    toNumber: string;
  },
): Promise<void> {
  const toNumber = normalizeE164(params.toNumber);
  const fromNumber = params.fromNumber;
  const callSessionId = params.callSessionId ?? null;

  console.log('[INBOUND-WEBHOOK] initiated', {
    session: callSessionId,
    control: params.providerCallId,
    from: fromNumber,
    to: toNumber,
  });

  const ownedNumber = await getCachedNumberOwner(supabase, toNumber);
  if (!ownedNumber) {
    console.log('[INBOUND-WEBHOOK] unknown DID — reject', toNumber);
    await hangupProviderCall(params.providerCallId);
    return;
  }

  const ownerUserId = ownedNumber.user_id as string;
  const workspaceId = await resolveUserWorkspaceId(supabase, ownerUserId);

  if (callSessionId) {
    const existing = await findInboundCallBySession(supabase, callSessionId);
    if (existing?.id) {
      console.log('[INBOUND-WEBHOOK] duplicate session — skip', callSessionId);
      return;
    }
  }

  const { data: ownedRows } = await supabase
    .from('purchased_numbers')
    .select('phone_number')
    .eq('user_id', ownerUserId)
    .neq('status', 'released');

  const lead = fromNumber
    ? await findLeadByCallerPhone(supabase, ownerUserId, fromNumber, {
      excludeNumbers: (ownedRows ?? []).map((r) => r.phone_number as string),
    })
    : null;

  const routing = await resolveNumberRouting(
    supabase,
    ownerUserId,
    ownedNumber.id as string | undefined,
  );

  console.log('[INBOUND-ROUTE] mode', routing.inbound_mode);

  const preCtx: Omit<InboundRoutingContext, 'callsRowId'> = {
    providerCallId: params.providerCallId,
    callSessionId,
    fromNumber,
    toNumber,
    ownerUserId,
    workspaceId: workspaceId ?? null,
    purchasedNumberId: ownedNumber.id as string | undefined,
  };

  const ringingUserId = ownerUserId;

  const callsRowId = await upsertInboundCallsRow(supabase, {
    ...preCtx,
    leadId: lead?.id ?? null,
    ringingUserId,
  });

  if (!callsRowId) return;

  console.log('[INBOUND-RINGING] call inserted, no auto-answer', {
    telnyx_session_id: callSessionId,
    user_id: ringingUserId,
    status: 'ringing',
  });

  const ctx: InboundRoutingContext = {
    ...preCtx,
    callsRowId,
  };

  if (routing.inbound_mode === 'off') {
    await hangupProviderCall(params.providerCallId);
    await setCallStatus(supabase, callsRowId, { status: 'missed', disposition: 'missed' });
    return;
  }

  if (routing.inbound_mode === 'voicemail') {
    await routeToVoicemail(supabase, ctx, routing, 'voicemail_mode');
    return;
  }

  if (routing.inbound_mode === 'forward') {
    await routeToForward(supabase, ctx, routing);
    return;
  }

  await routeInboundToBrowserAgents(supabase, ctx);
}

export async function finalizeInboundMissed(
  supabase: SupabaseClient,
  providerCallId: string,
): Promise<void> {
  const { data: call } = await supabase
    .from('calls')
    .select('id, status')
    .eq('telnyx_call_id', providerCallId)
    .eq('direction', 'inbound')
    .maybeSingle();

  if (!call || call.status !== 'ringing') return;

  console.log('[INBOUND-HANGUP] caller hung up while ringing', providerCallId);

  await supabase
    .from('calls')
    .update({
      status: 'missed',
      disposition: 'missed',
      ended_at: new Date().toISOString(),
    })
    .eq('id', call.id);
}
