import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTelnyxSignature } from '@/lib/telnyx-signature';
import { claimWebhookEvent } from '@/lib/webhooks/dedup';
import { triggerProcessCallAsync } from '@/lib/ai/trigger-process-call';
import { shouldSkipRecordingAiQueue } from '@/lib/ai/pipeline-status';
import { triggerMirrorRecordingAsync } from '@/lib/recordings/trigger-mirror';
import { normalizeE164 } from '@/lib/inbound/phone';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { triggerInboundRingTimeoutAsync } from '@/lib/inbound/trigger-ring-timeout';
import { findNumberOwnerWithMeta } from '@/lib/inbound/lookup-number';
import {
  bridgeInboundToBrowser,
  completeInboundBridge,
} from '@/lib/inbound/bridge-to-browser';
import { decodeClientState } from '@/lib/inbound/telnyx-actions';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';

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
  analytics_id: string | null;
  telnyx_session_id: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createServiceClient>;

/**
 * Look up a call by telnyx_session_id first (preferred), fall back to
 * telnyx_call_id (call_control_id). Returns null if not found.
 */
async function findCall(
  supabase: NonNullable<SupabaseClient>,
  sessionId: string | undefined,
  callControlId: string | undefined,
  select = 'id, user_id, lead_id, to_number, from_number, answered_at, direction, duration_seconds, was_recorded, ai_processing_status, ai_processed, ai_processed_at, recording_url, recording_supabase_path, analytics_id, telnyx_session_id',
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

    // WebRTC bridge leg stored on telnyx_session_id
    const { data: peer } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_session_id', callControlId)
      .maybeSingle();
    if (peer) return peer as unknown as CallRow;
  }
  return null;
}

async function telnyxCallAction(
  callControlId: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/${action}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error(`[TELNYX] ${action} failed:`, res.status, (await res.text()).slice(0, 200));
    }
    return res.ok;
  } catch (err) {
    console.error(`[TELNYX] ${action} exception:`, err);
    return false;
  }
}

async function startProgrammaticRecording(callControlId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${callControlId}/actions/record_start`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'mp3', channels: 'dual', play_beep: false }),
      },
    );
    if (res.ok) {
      console.log('[REC-A] record_start accepted for control id:', callControlId);
      return true;
    }
    const errText = await res.text();
    console.error('[REC-A] record_start failed:', res.status, errText.slice(0, 300));
    return false;
  } catch (err) {
    console.error('[REC-A] record_start exception:', err);
    return false;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Read raw body FIRST so we can verify the signature over the exact bytes
    // Telnyx signed. Re-parse JSON from the string.
    const rawBody = await request.text();
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    const verify = verifyTelnyxSignature(rawBody, signature, timestamp);
    if (!verify.ok) {
      console.error('[WEBHOOK] Signature verification FAILED:', verify.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body: TelnyxWebhookBody = JSON.parse(rawBody);
    const event = body.data;

    if (!event?.event_type) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { event_type, payload } = event;
    const callControlId = payload.call_control_id;
    const callSessionId = payload.call_session_id;

    console.log(`[WEBHOOK] ${event_type} | session=${callSessionId} | control=${callControlId} | from=${payload.from} | to=${payload.to}`);

    const supabase = createServiceClient();
    if (!supabase) {
      console.warn('[WEBHOOK] Service client unavailable');
      return NextResponse.json({ received: true });
    }

    if (event.id) {
      const claimed = await claimWebhookEvent(supabase, event.id, 'telnyx', event_type);
      if (!claimed) {
        return NextResponse.json({ received: true, duplicate: true });
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
        if (bridgeState?.gd_inbound_bridge) {
          console.log('[WEBHOOK] Inbound browser bridge leg initiated:', callControlId);
          return NextResponse.json({ received: true });
        }

        const toNumber = normalizeE164(payload.to ?? '');
        const fromNumber = normalizeE164(payload.from ?? '');
        const ownedTo = await findNumberOwnerWithMeta(supabase, toNumber);
        const dirInbound = directionSaysInbound(payload.direction);
        const treatAsInbound = dirInbound === true || (dirInbound === null && Boolean(ownedTo));

        if (treatAsInbound) {
        // ── INBOUND CALL ────────────────────────────────────────────────────
        console.log('[INBOUND] Incoming call:', fromNumber, '→', toNumber, '| raw_to:', payload.to, '| raw_from:', payload.from, '| direction:', payload.direction);

        const ownedNumber = ownedTo;

        console.log('[INBOUND] Number lookup — to:', toNumber, '| found:', ownedNumber?.phone_number ?? 'none', '| status:', ownedNumber?.status ?? 'n/a', '| user:', ownedNumber?.user_id ?? 'none');

        if (!ownedNumber) {
          console.log('[INBOUND] No active owner for number — rejecting:', toNumber);
          await telnyxCallAction(callControlId, 'reject', { cause: 'CALL_REJECTED' });
          return NextResponse.json({ received: true });
        }

        const userId = ownedNumber.user_id as string;
        const workspaceId =
          (ownedNumber.workspace_id as string | null | undefined)
          ?? await resolveUserWorkspaceId(supabase, userId);

        const lead = await findLeadByCallerPhone(supabase, userId, fromNumber);

        // Create inbound call record (realtime subscription in browser will pick this up)
        const { data: newCall, error: insertErr } = await supabase
          .from('calls')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            lead_id: lead?.id ?? null,
            direction: 'inbound',
            telnyx_call_id: callControlId,
            telnyx_session_id: callSessionId ?? null,
            from_number: fromNumber,
            to_number: toNumber,
            status: 'ringing',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertErr) {
          console.error('[INBOUND] Call insert failed:', insertErr.message);
        }

        console.log('[INBOUND] Call record created:', newCall?.id, '| lead:', lead?.id ?? 'unknown', '| workspace:', workspaceId ?? 'none');

        // Get user routing settings
        const { data: inboundSettings } = await supabase
          .from('user_settings')
          .select('inbound_mode, inbound_forward_number, inbound_ring_seconds')
          .eq('user_id', userId)
          .maybeSingle();

        const mode = (inboundSettings?.inbound_mode as string | null) ?? 'browser';
        const ringSeconds = (inboundSettings?.inbound_ring_seconds as number | null) ?? 25;

        if (mode === 'off') {
          await telnyxCallAction(callControlId, 'reject', { cause: 'CALL_REJECTED' });
          if (newCall?.id) {
            await supabase
              .from('calls')
              .update({ status: 'rejected', disposition: 'missed', ended_at: new Date().toISOString() })
              .eq('id', newCall.id);
          }
          console.log('[INBOUND] Rejected (off mode)');
        } else if (mode === 'forward' && inboundSettings?.inbound_forward_number) {
          const forwardTo = normalizeE164(inboundSettings.inbound_forward_number as string);
          await telnyxCallAction(callControlId, 'answer');
          await new Promise((r) => setTimeout(r, 600));
          await telnyxCallAction(callControlId, 'transfer', {
            to: forwardTo || (inboundSettings.inbound_forward_number as string),
            from: toNumber,
          });
          console.log('[INBOUND] Forwarded to:', inboundSettings.inbound_forward_number);
          if (newCall?.id) {
            triggerInboundRingTimeoutAsync(newCall.id, callControlId, userId, ringSeconds, mode);
          }
        } else if (mode === 'voicemail') {
          // Answer + immediately start recording with a beep — caller hears
          // the beep and knows to leave a message. Recording saved via
          // call.recording.saved → existing AI pipeline processes it.
          await telnyxCallAction(callControlId, 'answer');
          await telnyxCallAction(callControlId, 'record_start', {
            format: 'mp3',
            channels: 'single',
            play_beep: true,
          });
          if (newCall?.id) {
            await supabase
              .from('calls')
              .update({ status: 'voicemail', disposition: 'voicemail' })
              .eq('id', newCall.id);
          }
          console.log('[INBOUND] Voicemail: answered + recording started for user:', userId);
        } else {
          // browser mode (default): answer + bridge to user's WebRTC SIP endpoint.
          const bridged = await bridgeInboundToBrowser(
            supabase,
            userId,
            callControlId,
            fromNumber,
            toNumber,
            newCall?.id,
          );
          console.log('[INBOUND] Browser bridge:', bridged.ok ? bridged.strategy : 'failed', '| user:', userId);
          if (!bridged.ok && newCall?.id) {
            await supabase
              .from('calls')
              .update({ status: 'failed', disposition: 'missed', ended_at: new Date().toISOString() })
              .eq('id', newCall.id);
          }
          if (newCall?.id) {
            triggerInboundRingTimeoutAsync(newCall.id, callControlId, userId, ringSeconds, mode);
          }
        }
        } else {
        // ── OUTBOUND CALL (existing upsert logic) ────────────────────────────
        const { error } = await supabase
          .from('calls')
          .upsert(
            {
              telnyx_call_id: callControlId,
              telnyx_session_id: callSessionId ?? null,
              status: 'ringing',
              from_number: payload.from ?? null,
              to_number: payload.to ?? null,
            },
            { onConflict: 'telnyx_call_id', ignoreDuplicates: false },
          );
        if (error) console.error('[WEBHOOK] call.initiated upsert error:', error);
        else console.log('[WEBHOOK] call.initiated — upserted, session_id:', callSessionId);
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
        await supabase
          .from('calls')
          .update({ status: 'ringing', ...(callSessionId ? { telnyx_session_id: callSessionId } : {}) })
          .eq('telnyx_call_id', callControlId);
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
      if (
        answeredBridgeState?.gd_inbound_bridge
        && answeredBridgeState.pstn_call_control_id
        && callControlId
      ) {
        const pstnId = String(answeredBridgeState.pstn_call_control_id);
        const bridged = await completeInboundBridge(pstnId, callControlId);
        const dbCallId = answeredBridgeState.db_call_id as string | null | undefined;
        if (bridged && dbCallId) {
          await supabase
            .from('calls')
            .update({
              status: 'in_progress',
              answered_at: new Date().toISOString(),
            })
            .eq('id', dbCallId);
        }
        console.log('[INBOUND] WebRTC leg answered — bridge:', bridged ? 'ok' : 'failed');
        return NextResponse.json({ received: true });
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

      const callRow = await findCall(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.error('[WEBHOOK] call.answered — call not found. session:', callSessionId, '| control:', callControlId);
        return NextResponse.json({ received: true });
      }

      console.log('[WEBHOOK] call.answered — call id:', callRow.id);

      // Update status (also save session ID here as a safety net)
      const nextStatus = callRow.direction === 'inbound' ? 'in_progress' : 'answered';
      await supabase
        .from('calls')
        .update({
          status: nextStatus,
          answered_at: new Date().toISOString(),
          ...(callSessionId && !callRow.telnyx_session_id ? { telnyx_session_id: callSessionId } : {}),
        })
        .eq('id', callRow.id);

      // Check user recording preference
      const { data: settings } = await supabase
        .from('user_settings')
        .select('recording_mode')
        .eq('user_id', callRow.user_id)
        .single();

      const recordingMode = settings?.recording_mode ?? 'always';
      console.log('[REC-A] Answered. mode:', recordingMode, '| control_id:', callControlId, '| call_id:', callRow.id);

      if (recordingMode !== 'never' && callControlId) {
        // START PROGRAMMATIC RECORDING — triggers call.recording.saved webhook
        const started = await startProgrammaticRecording(callControlId);
        if (started) {
          await supabase.from('calls').update({ was_recorded: true }).eq('id', callRow.id);
        } else {
          console.warn('[REC-A] record_start failed — recording NOT started');
        }
      } else {
        console.log('[REC-A] Recording NOT started — mode:', recordingMode, '| has_control_id:', !!callControlId);
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

      const callRow = await findCall(
        supabase, callSessionId, callControlId,
        'id, user_id, lead_id, answered_at, to_number, from_number, direction, duration_seconds, was_recorded, disposition, status',
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
        await supabase
          .from('calls')
          .update({
            status: 'completed',
            ended_at: endedAt,
            hangup_cause: hangupCause,
            ...(durationSeconds !== null ? { duration_seconds: durationSeconds } : {}),
          })
          .eq('id', callRow.id);

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

        // Detect missed inbound call (hung up before answered — not voicemail)
        const isVoicemail =
          callRow.disposition === 'voicemail' || callRow.status === 'voicemail';
        if (callRow.direction === 'inbound' && !callRow.answered_at && !isVoicemail) {
          await supabase
            .from('calls')
            .update({ disposition: 'missed', status: 'missed' })
            .eq('id', callRow.id);

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
      // Log full payload shape once so we can see exact Telnyx response structure
      console.log('[REC-B] FULL payload:', JSON.stringify(payload).slice(0, 1500));

      // Telnyx S3 storage sends URLs in public_recording_urls (no auth required).
      // Private storage sends them in recording_urls (needs Telnyx API key auth).
      // Handle both: prefer public first (works with any storage config).
      const recordingUrl =
        payload.public_recording_urls?.mp3 ??
        payload.public_recording_urls?.wav ??
        payload.recording_urls?.mp3 ??
        payload.recording_urls?.wav ??
        null;

      console.log('[REC-B] recording.saved fired. session:', callSessionId,
        '| public_urls:', JSON.stringify(payload.public_recording_urls),
        '| private_urls:', JSON.stringify(payload.recording_urls),
        '| resolved url:', recordingUrl);

      if (!recordingUrl) {
        console.error('[REC-B] NO recording URL in payload — both recording_urls and public_recording_urls are empty. Full payload:', JSON.stringify(payload));
        return NextResponse.json({ received: true });
      }

      const callRow = await findCall(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.error('[REC-B] Call not found. session:', callSessionId, '| control:', callControlId);
        return NextResponse.json({ received: true });
      }

      console.log('[REC-B] Call:', callRow.id, '| ai_processing_status:', callRow.ai_processing_status);

      if (shouldSkipRecordingAiQueue(callRow)) {
        console.log('[REC-B] Already queued/completed — skipping AI re-queue. status:', callRow.ai_processing_status);
        // Still ensure recording_url is persisted if this is a duplicate webhook with URL
        if (!callRow.recording_url) {
          await supabase.from('calls').update({ recording_url: recordingUrl, was_recorded: true }).eq('id', callRow.id);
        }
        return NextResponse.json({ received: true });
      }

      // Fetch user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize, ai_detect_sentiment, ai_extract_talking_points')
        .eq('user_id', callRow.user_id)
        .single();

      const recordingMode = settings?.recording_mode ?? 'always';
      if (recordingMode === 'never') {
        console.log('[REC-B] recording_mode=never — skipping');
        return NextResponse.json({ received: true });
      }

      // 30-second minimum rule.
      // Use payload duration first (most accurate for this recording),
      // fall back to call duration_seconds (set by hangup event, usually already populated).
      const payloadDuration = payload.recording_duration_millis
        ? Math.round(payload.recording_duration_millis / 1000)
        : null;
      const dur = payloadDuration ?? callRow.duration_seconds ?? 0;
      const MIN_RECORDING_SECONDS = 30;

      console.log('[REC-B] duration resolved:', dur, 's (payload:', payloadDuration, '| db:', callRow.duration_seconds, ')');

      // Skip ONLY when we have a confirmed-short duration. Unknown duration (0)
      // means the call hung up before duration was written — fall through and
      // save the recording so the user can hear what was actually captured.
      if (dur > 0 && dur < MIN_RECORDING_SECONDS && settings?.recording_auto_delete_short !== false) {
        console.log(`[REC-B] Call too short (${dur}s < ${MIN_RECORDING_SECONDS}s) — skipping recording AND AI`);
        await supabase
          .from('calls')
          .update({ ai_processing_status: 'skipped_short' })
          .eq('id', callRow.id);
        return NextResponse.json({ received: true, skipped: 'short_call' });
      }

      // Save recording URL + duration + mark as processing
      const recordingUpdate: Record<string, unknown> = {
        recording_url: recordingUrl,
        was_recorded: true,
        ai_processing_status: 'pending',
      };
      if (payloadDuration && payloadDuration > 0) {
        recordingUpdate.recording_duration_seconds = payloadDuration;
      }

      const { error: updateErr } = await supabase
        .from('calls')
        .update(recordingUpdate)
        .eq('id', callRow.id);

      if (updateErr) {
        console.error('[REC-B] Failed to save recording_url:', updateErr);
        return NextResponse.json({ received: true, error: 'recording_save_failed' });
      }
      console.log('[REC-C] recording_url saved to DB for call:', callRow.id);

      triggerMirrorRecordingAsync(
        callRow.id,
        callRow.user_id,
        recordingUrl,
        callRow.recording_supabase_path,
      );

      // Determine if any AI feature is enabled (default to true when no settings row exists)
      const anyAiEnabled =
        (settings?.ai_auto_transcribe ?? true) ||
        (settings?.ai_auto_summarize ?? true) ||
        (settings?.ai_detect_sentiment ?? true) ||
        (settings?.ai_extract_talking_points ?? true);

      if (anyAiEnabled) {
        if (!process.env.INTERNAL_API_SECRET?.trim()) {
          console.error('[REC-D] INTERNAL_API_SECRET not set — cannot trigger AI pipeline for call:', callRow.id);
          await supabase
            .from('calls')
            .update({ ai_processing_status: 'failed', ai_error: 'INTERNAL_API_SECRET not configured' })
            .eq('id', callRow.id);
        } else {
          console.log('[REC-D] Triggering AI pipeline for call:', callRow.id);
          triggerProcessCallAsync(callRow.id);
        }
      } else {
        console.log('[REC-B] All AI settings disabled — recording saved, skipping AI');
        await supabase
          .from('calls')
          .update({ ai_processing_status: 'completed' })
          .eq('id', callRow.id);
      }

      // Log activity
      await supabase.from('activities').insert({
        user_id: callRow.user_id,
        type: 'call',
        lead_id: callRow.lead_id ?? null,
        description: 'Recording saved — AI analysis queued',
        metadata: { event: 'call.recording.saved', call_id: callRow.id, recording_url: recordingUrl },
      }).maybeSingle();
    }

    // ── other events ─────────────────────────────────────────────────────────
    else {
      console.log('[WEBHOOK] Unhandled event:', event_type);
    }

    return NextResponse.json({ received: true, event_type });
  } catch (error) {
    console.error('[WEBHOOK] Top-level error:', error);
    // Always 200 — never let Telnyx retry due to our own errors
    return NextResponse.json({ received: true, error: String(error) });
  }
}
