import { createServiceClient } from '@/lib/supabase/service';
import { claimWebhookEvent } from '@/lib/webhooks/dedup';
import { maybeAutoStartRecording } from '@/lib/recordings/auto-start';
import {
  handleCallRecordingSaved,
  resolveRecordingUrl,
} from '@/lib/recordings/handle-saved';
import { handleCoachLegAnswered } from '@/lib/coaching/telnyx-conference';
import { normalizeE164, normalizeInboundCallerId } from '@/lib/inbound/phone';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { completeInboundBridge } from '@/lib/inbound/bridge-to-browser';
import { decodeClientState } from '@/lib/inbound/telnyx-actions';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { shouldRecordInboundAnswer } from '@/lib/inbound/routing-matrix';
import {
  finalizeInboundMissed,
  handleInboundCallInitiated,
  markInboundAccepted,
} from '@/lib/telephony/telnyx/inbound-router';
import { voiceLog } from '@/lib/voice/structured-log';
import { voiceSessionLog } from '@/lib/voice/session-log';
import type { FastAnswerResult } from '@/lib/telnyx/fast-answer';
import { markWebhookProcessed } from '@/lib/telephony/telnyx/webhook-log';
import { logCallEvent } from '@/lib/webhooks/log-call-event';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';

function directionSaysInbound(direction: string | undefined): boolean | null {
  const d = (direction ?? '').toLowerCase();
  if (d === 'incoming' || d === 'inbound') return true;
  if (d === 'outgoing' || d === 'outbound') return false;
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelnyxEventPayload {
  call_control_id?: string;
  call_leg_id?: string;
  call_session_id?: string;
  direction?: string;
  from?: string;
  to?: string;
  state?: string;
  hangup_cause?: string;
  result?: string;
  start_time?: string;
  end_time?: string;
  // recording.saved: private Telnyx storage URL (requires auth header)
  recording_urls?: { mp3?: string; wav?: string };
  // recording.saved: public Telnyx S3 storage URL (no auth needed) — used when
  // storage is set to "Telnyx S3" in the portal; this is often the only URL populated
  public_recording_urls?: { mp3?: string; wav?: string };
  // recording.saved duration fields
  recording_duration_millis?: number;
  recording_started_at?: string;
  recording_ended_at?: string;
  duration_millis?: number;
  duration_seconds?: number;
  client_state?: string;
  connection_id?: string;
}

interface TelnyxEvent {
  event_type: string;
  id: string;
  occurred_at: string;
  payload: TelnyxEventPayload;
}

interface TelnyxWebhookBody {
  data: TelnyxEvent;
  meta?: Record<string, unknown>;
}

interface CallRow {
  id: string;
  user_id: string;
  lead_id: string | null;
  to_number: string | null;
  from_number: string | null;
  answered_at: string | null;
  direction: string | null;
  status: string | null;
  disposition: string | null;
  duration_seconds: number | null;
  was_recorded: boolean | null;
  ai_processing_status: string | null;
  ai_processed: boolean | null;
  ai_processed_at: string | null;
  recording_url: string | null;
  recording_supabase_path: string | null;
  recording_status: string | null;
  telnyx_call_id?: string | null;
  telnyx_webrtc_leg_id?: string | null;
  analytics_id: string | null;
  telnyx_session_id: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createServiceClient>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * WebRTC outbound often sends call.answered before /api/calls/dial registers the row.
 */
async function findCallWithRetry(
  supabase: NonNullable<SupabaseClient>,
  sessionId: string | undefined,
  callControlId: string | undefined,
  select?: string,
): Promise<CallRow | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await findCall(supabase, sessionId, callControlId, select);
    if (row) return row;
    if (attempt < 7) await sleep(250);
  }
  return null;
}

/**
 * Look up a call by telnyx_session_id first (preferred), fall back to
 * telnyx_call_id (call_control_id). Returns null if not found.
 */
async function findCall(
  supabase: NonNullable<SupabaseClient>,
  sessionId: string | undefined,
  callControlId: string | undefined,
  select = 'id, user_id, lead_id, to_number, from_number, answered_at, direction, duration_seconds, was_recorded, ai_processing_status, ai_processed, ai_processed_at, recording_url, recording_supabase_path, recording_status, analytics_id, telnyx_session_id, telnyx_call_id, telnyx_webrtc_leg_id',
): Promise<CallRow | null> {
  // Try session ID first (more stable across call legs)
  if (sessionId) {
    const { data } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as unknown as CallRow;
  }
  // Fall back to call_control_id (PSTN leg)
  if (callControlId) {
    const { data } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_call_id', callControlId)
      .maybeSingle();
    if (data) return data as unknown as CallRow;

    // WebRTC bridge leg (preferred column)
    const { data: webrtcPeer } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_webrtc_leg_id', callControlId)
      .maybeSingle();
    if (webrtcPeer) return webrtcPeer as unknown as CallRow;

    // Legacy: WebRTC leg stored on telnyx_session_id before migration 051
    const { data: peer } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_session_id', callControlId)
      .maybeSingle();
    if (peer) return peer as unknown as CallRow;
  }
  return null;
}

// ─── Background processor (invoked via waitUntil from route.ts) ───────────────

async function processTelnyxWebhookBackground(
  body: TelnyxWebhookBody,
  receivedAt: string,
  answerMeta: FastAnswerResult | null,
): Promise<void> {
  try {
    const event = body.data;
    const { event_type, payload } = event;
    const callControlId = payload.call_control_id;
    const callSessionId = payload.call_session_id;

    console.log(`[WEBHOOK] bg ${event_type} | session=${callSessionId} | control=${callControlId} | from=${payload.from} | to=${payload.to}`);
    voiceLog.info(
      {
        service: 'telnyx-webhook',
        event: event_type,
        call_control_id: callControlId,
        session_id: callSessionId,
      },
      'Webhook received (background)',
    );

    const supabase = createServiceClient();
    if (!supabase) {
      console.warn('[WEBHOOK] Service client unavailable');
      return;
    }

    await logCallEvent(supabase, {
      call_control_id: callControlId ?? 'unknown',
      event_type,
      received_at: receivedAt,
      answer_sent_at: answerMeta?.answerSentAt ?? null,
      answer_response_time_ms: answerMeta?.responseTimeMs ?? null,
      telnyx_status: answerMeta?.telnyxStatus ?? null,
      error_message: answerMeta?.errorMessage ?? null,
    });

    if (event.id) {
      const claimed = await claimWebhookEvent(supabase, event.id, 'telnyx', event_type);
      if (!claimed) {
        return;
      }
    }

    // ── call.initiated ──────────────────────────────────────────────────────
    if (event_type === 'call.initiated') {
      if (!callControlId) {
        console.warn('[WEBHOOK] call.initiated missing call_control_id — skipping');
      } else {
        const bridgeState = decodeClientState(
          (payload as TelnyxEventPayload & { client_state?: string }).client_state,
        );
        if (bridgeState?.gd_inbound_leg_b || bridgeState?.gd_parallel_bridge) {
          // Leg B of a SIP transfer (ring-group agent) or parallel-dial bridge leg —
          // internal signaling leg, never a customer-facing `calls` row.
          console.log('[WEBHOOK] Internal bridge/transfer leg initiated:', callControlId);
          return;
        }

        const toNumber = normalizeE164(payload.to ?? '');
        const fromNumber = normalizeInboundCallerId(payload.from ?? '');
        const ownedTo = await getCachedNumberOwner(supabase, toNumber);
        const dirInbound = directionSaysInbound(payload.direction);
        const treatAsInbound = dirInbound === true || (dirInbound === null && Boolean(ownedTo));

        if (treatAsInbound) {
        await handleInboundCallInitiated(supabase, {
          providerCallId: callControlId,
          callSessionId: callSessionId ?? undefined,
          fromNumber,
          toNumber,
          direction: payload.direction,
        });
        } else {
        // ── OUTBOUND CALL — update existing row only (WebRTC dial route owns insert) ──
        const { data: existingOutbound } = await supabase
          .from('calls')
          .select('id')
          .eq('telnyx_call_id', callControlId)
          .maybeSingle();

        if (existingOutbound) {
          const { error } = await supabase
            .from('calls')
            .update({
              telnyx_session_id: callSessionId ?? null,
              status: 'ringing',
              from_number: payload.from ?? null,
              to_number: payload.to ?? null,
            })
            .eq('id', existingOutbound.id);
          if (error) console.error('[WEBHOOK] call.initiated outbound update error:', error);
          else console.log('[WEBHOOK] call.initiated — updated outbound row:', existingOutbound.id);
        } else {
          const fromNumber = normalizeE164(payload.from ?? '');
          const toNumber = normalizeE164(payload.to ?? '');
          const ownedFrom = fromNumber
            ? await getCachedNumberOwner(supabase, fromNumber)
            : null;

          if (ownedFrom?.user_id) {
            const userId = ownedFrom.user_id as string;
            const workspaceId =
              (ownedFrom.workspace_id as string | null | undefined)
              ?? await resolveUserWorkspaceId(supabase, userId);
            const { data: bootstrapped, error: bootstrapErr } = await supabase
              .from('calls')
              .insert({
                user_id: userId,
                workspace_id: workspaceId,
                direction: 'outbound',
                telnyx_call_id: callControlId,
                telnyx_session_id: callSessionId ?? null,
                from_number: fromNumber,
                to_number: toNumber,
                status: 'ringing',
                started_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (bootstrapErr) {
              console.log(
                '[WEBHOOK] call.initiated — outbound bootstrap race (dial may own insert):',
                bootstrapErr.message,
              );
            } else {
              console.log('[WEBHOOK] call.initiated — outbound row bootstrapped:', bootstrapped?.id);
            }
          } else {
            console.log(
              '[WEBHOOK] call.initiated — outbound row pending (unknown caller ID):',
              callControlId,
            );
          }
        }
        }
      }
    }

    // ── call.ringing ────────────────────────────────────────────────────────
    else if (event_type === 'call.ringing') {
      console.log('[WEBHOOK] call.ringing — receiver phone is ringing:', {
        callControlId,
        from: payload.from,
        to: payload.to,
      });
      if (callControlId) {
        const { data: ringRow } = await supabase
          .from('calls')
          .select('id, direction')
          .eq('telnyx_call_id', callControlId)
          .maybeSingle();

        if (ringRow?.direction === 'inbound') {
          // Inbound PSTN ring — never overwrite telnyx_webrtc_leg_id / session used for bridge.
          await supabase
            .from('calls')
            .update({ status: 'ringing' })
            .eq('id', ringRow.id);
        } else {
          await supabase
            .from('calls')
            .update({
              status: 'ringing',
              ...(callSessionId ? { telnyx_session_id: callSessionId } : {}),
            })
            .eq('telnyx_call_id', callControlId);
        }

        await supabase
          .from('parallel_dial_legs')
          .update({ status: 'ringing', updated_at: new Date().toISOString() })
          .eq('telnyx_call_id', callControlId)
          .in('status', ['dialing']);
      }
    }

    // ── AMD (parallel dial machine/human detection) ─────────────────────────
    else if (
      event_type === 'call.machine.detection.ended'
      || event_type === 'call.machine.premium.detection.ended'
    ) {
      if (callControlId) {
        const amdResult = payload.result ?? 'not_sure';
        const { handleParallelLegAmd } = await import('@/lib/parallel-dial/handle-amd');
        await handleParallelLegAmd(
          supabase,
          callControlId,
          amdResult,
          payload.from ?? null,
        );
        console.log('[WEBHOOK] AMD result:', amdResult, 'for', callControlId);
      }
    }

    // ── call.answered ───────────────────────────────────────────────────────
    else if (event_type === 'call.answered') {
      const answeredBridgeState = decodeClientState(
        (payload as TelnyxEventPayload & { client_state?: string }).client_state,
      );

      if (answeredBridgeState?.gd_coaching_join && callControlId) {
        await handleCoachLegAnswered(supabase, callControlId, answeredBridgeState);
        console.log('[COACHING] Coach leg joined conference:', callControlId);
        return;
      }

      if (
        answeredBridgeState?.gd_parallel_bridge
        && answeredBridgeState.prospect_call_control_id
        && callControlId
      ) {
        const prospectId = String(answeredBridgeState.prospect_call_control_id);
        const bridged = await completeInboundBridge(prospectId, callControlId);
        console.log('[PARALLEL] WebRTC leg answered — bridge:', bridged ? 'ok' : 'failed');
        return;
      }

      if (
        answeredBridgeState?.gd_inbound_leg_b
        && answeredBridgeState.inbound_call_id
        && callControlId
      ) {
        // Leg B (agent's SIP transfer target) answered — Telnyx bridges it to the
        // original PSTN leg natively. No manual bridge command needed here.
        const inboundCallId = String(answeredBridgeState.inbound_call_id);
        const agentId = String(answeredBridgeState.agent_id ?? '');

        await logInboundCallStep(supabase, callControlId, 'leg_b_answered');

        const { data: inboundRow } = await supabase
          .from('inbound_calls')
          .select('id, status, provider_call_id')
          .eq('id', inboundCallId)
          .maybeSingle();

        if (inboundRow?.status === 'ringing' && agentId) {
          await markInboundAccepted(supabase, inboundCallId, agentId);

          const pstnId = inboundRow.provider_call_id as string;
          const { data: callRow } = await supabase
            .from('calls')
            .select('id, to_number, from_number, user_id, telnyx_call_id, recording_status')
            .eq('telnyx_call_id', pstnId)
            .maybeSingle();

          if (callRow?.id) {
            await logInboundCallStep(supabase, pstnId, 'active');
            const recordEnabled = await shouldRecordInboundAnswer(
              supabase,
              agentId,
              undefined,
              callRow.to_number as string | undefined,
            );
            if (recordEnabled && callRow?.id) {
              await maybeAutoStartRecording(supabase, callRow, pstnId);
            }
          }
        }

        console.log('[INBOUND] Leg B (agent) answered — bridge:', inboundRow?.status === 'active' ? 'already active' : 'ok');
        return;
      }

      if (callControlId) {
        const { handleParallelLegAnswered } = await import('@/lib/parallel-dial/handle-answered');
        const parallel = await handleParallelLegAnswered(
          supabase,
          callControlId,
          payload.from ?? null,
        );
        if (parallel.sessionId) {
          console.log('[WEBHOOK] parallel leg answered — session:', parallel.sessionId, 'bridged:', parallel.bridged);
        }
      }

      const callRow = await findCallWithRetry(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.warn(
          '[WEBHOOK] call.answered — call not found after retry. session:',
          callSessionId,
          '| control:',
          callControlId,
        );
        return;
      }

      console.log('[WEBHOOK] call.answered — call id:', callRow.id);

      // Inbound Leg A answered before agent accept — no hold; status stays ringing until accept.
      if (
        callRow.direction === 'inbound'
        && (callRow.status === 'ringing' || callRow.status === null)
        && !callRow.answered_at
        && callControlId
        && callRow.telnyx_call_id === callControlId
      ) {
        await logInboundCallStep(supabase, callControlId, 'leg_a_answered');
        return;
      }

      // Update status (also save session ID here as a safety net)
      const nextStatus = callRow.direction === 'inbound' ? 'active' : 'answered';
      await supabase
        .from('calls')
        .update({
          status: nextStatus,
          answered_at: new Date().toISOString(),
          ...(callSessionId && !callRow.telnyx_session_id ? { telnyx_session_id: callSessionId } : {}),
        })
        .eq('id', callRow.id);

      if (callRow.direction === 'inbound' && callControlId) {
        const { data: inboundRow } = await supabase
          .from('inbound_calls')
          .select('id, routed_agent_id, status')
          .eq('provider_call_id', callControlId)
          .maybeSingle();
        if (inboundRow?.id && inboundRow.status === 'ringing') {
          const agentId = (inboundRow.routed_agent_id as string | null) ?? (callRow.user_id as string);
          await markInboundAccepted(supabase, inboundRow.id, agentId);
        }
      }

      if (callControlId) {
        await maybeAutoStartRecording(supabase, callRow, callControlId);
      }

      // Activity log
      await supabase.from('activities').insert({
        user_id: callRow.user_id,
        type: 'call',
        lead_id: callRow.lead_id ?? null,
        description: `Call answered${callRow.lead_id ? '' : ` — ${callRow.to_number ?? 'unknown'}`}`,
        metadata: { event: 'call.answered', call_id: callRow.id },
      }).maybeSingle();
    }

    // ── call.hangup ─────────────────────────────────────────────────────────
    else if (event_type === 'call.hangup') {
      if (callControlId) {
        const { handleParallelLegHangup } = await import('@/lib/parallel-dial/handle-answered');
        await handleParallelLegHangup(supabase, callControlId, payload.hangup_cause ?? null);
      }

      const hangupBridgeState = decodeClientState(payload.client_state);

      // Leg B (agent's SIP transfer target) hung up/rejected/unreachable — the
      // original PSTN leg is untouched by this (Telnyx keeps it live per the
      // transfer contract), so advance the ring group to the next agent instead
      // of treating this as the call ending. Checked by tagged client_state,
      // not the shared call_session_id, since Leg B shares that session with
      // the original leg and a heuristic match would wrongly mark it missed.
      if (hangupBridgeState?.gd_inbound_leg_b && hangupBridgeState.inbound_call_id) {
        const inboundCallId = String(hangupBridgeState.inbound_call_id);
        const { data: inboundRow } = await supabase
          .from('inbound_calls')
          .select('id, status')
          .eq('id', inboundCallId)
          .maybeSingle();

        if (inboundRow?.status === 'ringing') {
          console.log('[INBOUND] Leg B hangup while ringing — advancing ring group:', inboundCallId);
          const { advanceInboundRingGroup } = await import('@/lib/telephony/telnyx/inbound-router');
          await advanceInboundRingGroup(supabase, inboundCallId, 'agent_unreachable');
        } else {
          console.log('[INBOUND] Leg B hangup — inbound call already', inboundRow?.status ?? 'resolved');
        }
        return;
      }

      const callRow = await findCall(
        supabase, callSessionId, callControlId,
        'id, user_id, lead_id, answered_at, to_number, from_number, direction, duration_seconds, was_recorded, disposition, status, telnyx_call_id, telnyx_session_id',
      );

      const endedAt = new Date().toISOString();
      const hangupCause = payload.hangup_cause ?? null;

      let durationSeconds: number | null = null;
      if (payload.duration_millis) {
        durationSeconds = Math.round(payload.duration_millis / 1000);
      } else if (payload.duration_seconds) {
        durationSeconds = payload.duration_seconds;
      } else if (callRow?.answered_at) {
        durationSeconds = Math.round(
          (new Date(endedAt).getTime() - new Date(callRow.answered_at).getTime()) / 1000,
        );
      }

      console.log('[WEBHOOK] call.hangup — cause:', hangupCause, '| duration:', durationSeconds, 's');

      if (callRow) {
        const isVoicemail =
          callRow.disposition === 'voicemail' || callRow.status === 'voicemail';
        const inboundStillRinging =
          callRow.direction === 'inbound'
          && !callRow.answered_at
          && !isVoicemail
          && (callRow.status === 'ringing' || callRow.status === null);

        if (inboundStillRinging) {
          await supabase
            .from('calls')
            .update({
              disposition: 'missed',
              status: 'missed',
              ended_at: endedAt,
              hangup_cause: hangupCause,
            })
            .eq('id', callRow.id);
        } else {
          await supabase
            .from('calls')
            .update({
              status: 'completed',
              ended_at: endedAt,
              hangup_cause: hangupCause,
              ...(durationSeconds !== null ? { duration_seconds: durationSeconds } : {}),
            })
            .eq('id', callRow.id);
        }

        if (callRow.lead_id) {
          await supabase.from('leads').update({ last_called_at: endedAt }).eq('id', callRow.lead_id);
        }

        const durStr = durationSeconds
          ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`
          : null;
        await supabase.from('activities').insert({
          user_id: callRow.user_id,
          type: 'call',
          lead_id: callRow.lead_id ?? null,
          description: durStr ? `Call ended — ${durStr}` : `Call ended${hangupCause ? ` (${hangupCause})` : ''}`,
          metadata: { event: 'call.hangup', call_id: callRow.id, duration_seconds: durationSeconds, hangup_cause: hangupCause },
        }).maybeSingle();

        if (inboundStillRinging) {
          const pstnControlId = callRow.telnyx_call_id as string | null;
          if (pstnControlId && callControlId === pstnControlId) {
            await finalizeInboundMissed(supabase, pstnControlId);
            await logInboundCallStep(supabase, pstnControlId, 'missed');
          }

          const { data: notifSettings } = await supabase
            .from('user_settings')
            .select('missed_call_notify')
            .eq('user_id', callRow.user_id)
            .maybeSingle();

          if ((notifSettings?.missed_call_notify as boolean | null) !== false) {
            const callerLabel = callRow.from_number ?? 'unknown number';
            await supabase.from('notifications').insert({
              user_id: callRow.user_id,
              type: 'call',
              title: 'Missed Call',
              body: `Missed inbound call from ${callerLabel}`,
              metadata: { call_id: callRow.id, from_number: callRow.from_number, lead_id: callRow.lead_id },
            }).maybeSingle();
          }
          console.log('[INBOUND] Missed call logged:', callRow.from_number);
        }
      } else {
        // findCall returned null — try direct lookup by telnyx_call_id for inbound calls
        if (callControlId) {
          const { data: inboundRow } = await supabase
            .from('calls')
            .select('id, user_id, lead_id, answered_at, direction, from_number, status, disposition')
            .eq('telnyx_call_id', callControlId)
            .maybeSingle();

          if (inboundRow) {
            await supabase
              .from('calls')
              .update({
                status: 'completed',
                ended_at: endedAt,
                hangup_cause: hangupCause,
                ...(durationSeconds !== null ? { duration_seconds: durationSeconds } : {}),
              })
              .eq('id', inboundRow.id);

            const fallbackVoicemail =
              inboundRow.disposition === 'voicemail' || inboundRow.status === 'voicemail';
            if (inboundRow.direction === 'inbound' && !inboundRow.answered_at && !fallbackVoicemail) {
              await supabase
                .from('calls')
                .update({ disposition: 'missed', status: 'missed' })
                .eq('id', inboundRow.id);

              const { data: notifSettings } = await supabase
                .from('user_settings')
                .select('missed_call_notify')
                .eq('user_id', inboundRow.user_id)
                .maybeSingle();

              if ((notifSettings?.missed_call_notify as boolean | null) !== false) {
                await supabase.from('notifications').insert({
                  user_id: inboundRow.user_id,
                  type: 'call',
                  title: 'Missed Call',
                  body: `Missed inbound call from ${inboundRow.from_number ?? 'unknown'}`,
                  metadata: { call_id: inboundRow.id, from_number: inboundRow.from_number, lead_id: inboundRow.lead_id },
                }).maybeSingle();
              }
              console.log('[INBOUND] Missed call (fallback path):', inboundRow.from_number);
            }
            console.log('[WEBHOOK] call.hangup — resolved via telnyx_call_id fallback:', inboundRow.id);
          } else {
            // Last resort: blind update by control id
            await supabase
              .from('calls')
              .update({ status: 'completed', ended_at: endedAt, hangup_cause: hangupCause })
              .eq('telnyx_call_id', callControlId);
            console.warn('[WEBHOOK] call.hangup — call not found, updated by control id');
          }
        }
      }
    }

    // ── call.recording.saved ─────────────────────────────────────────────────
    else if (event_type === 'call.recording.saved') {
      console.log('[REC-B] FULL payload:', JSON.stringify(payload).slice(0, 1500));

      const recordingUrl = resolveRecordingUrl(payload);

      console.log('[REC-B] recording.saved fired. session:', callSessionId,
        '| public_urls:', JSON.stringify(payload.public_recording_urls),
        '| private_urls:', JSON.stringify(payload.recording_urls),
        '| resolved url:', recordingUrl);

      if (!recordingUrl) {
        console.error('[REC-B] NO recording URL in payload — both recording_urls and public_recording_urls are empty. Full payload:', JSON.stringify(payload));
        return;
      }

      const callRow = await findCall(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.error('[REC-B] Call not found. session:', callSessionId, '| control:', callControlId);
        return;
      }

      await handleCallRecordingSaved(supabase, callRow, payload, recordingUrl);
    }

    // ── call.bridged ────────────────────────────────────────────────────────
    // Fires on the original PSTN leg when a SIP-transfer Leg B connects.
    // Observability only — state transition is driven by Leg B's own
    // call.answered/call.hangup (tagged via target_leg_client_state).
    else if (event_type === 'call.bridged') {
      if (callControlId) {
        await logInboundCallStep(supabase, callControlId, 'call_bridged');
      }
    }

    // ── other events ─────────────────────────────────────────────────────────
    else {
      console.log('[WEBHOOK] Unhandled event:', event_type);
    }
  } catch (error) {
    voiceLog.error(
      {
        service: 'telnyx-webhook',
        error: error instanceof Error ? error.message : String(error),
      },
      'Webhook background error',
    );
  }
}


export async function processVoiceWebhookEvent(
  eventLogId: string,
  payload: Record<string, unknown>,
  answerMeta: FastAnswerResult | null = null,
): Promise<void> {
  const receivedAt = new Date().toISOString();
  try {
    await processTelnyxWebhookBackground(
      payload as unknown as Parameters<typeof processTelnyxWebhookBackground>[0],
      receivedAt,
      answerMeta,
    );
    await markWebhookProcessed(eventLogId, 'processed');
  } catch (error) {
    console.error('[telephony/voice] processor error:', error);
    await markWebhookProcessed(
      eventLogId,
      'failed',
      error instanceof Error ? error.message : 'processor_failed',
    );
  }
}
