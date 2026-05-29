import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

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
  start_time?: string;
  end_time?: string;
  recording_urls?: { mp3?: string; wav?: string };
  duration_millis?: number;
  duration_seconds?: number;
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
  ai_processed: boolean | null;
  analytics_id: string | null;
  duration_seconds: number | null;
  was_recorded: boolean | null;
  ai_processing_status: string | null;
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
  select = 'id, user_id, lead_id, to_number, answered_at, ai_processed, analytics_id, duration_seconds, was_recorded, ai_processing_status',
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
  // Fall back to call_control_id
  if (callControlId) {
    const { data } = await supabase
      .from('calls')
      .select(select)
      .eq('telnyx_call_id', callControlId)
      .maybeSingle();
    if (data) return data as unknown as CallRow;
  }
  return null;
}

async function ensureRecordingsBucket(supabase: NonNullable<SupabaseClient>) {
  try {
    await supabase.storage.createBucket('call-recordings', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'],
    });
  } catch {
    // Bucket already exists — ignore
  }
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
      console.log('[RECORDING] record_start accepted for control id:', callControlId);
      return true;
    }
    const errText = await res.text();
    console.error('[RECORDING] record_start failed:', res.status, errText.slice(0, 300));
    return false;
  } catch (err) {
    console.error('[RECORDING] record_start exception:', err);
    return false;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: TelnyxWebhookBody = await request.json();
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

    // ── call.initiated ──────────────────────────────────────────────────────
    if (event_type === 'call.initiated') {
      if (!callControlId) {
        console.warn('[WEBHOOK] call.initiated missing call_control_id — skipping');
      } else if (payload.direction === 'incoming') {
        // ── INBOUND CALL ────────────────────────────────────────────────────
        const toNumber = payload.to ?? '';
        const fromNumber = payload.from ?? '';
        console.log('[INBOUND] Incoming call:', fromNumber, '→', toNumber);

        // Find which user owns this GrowthDialer number
        const { data: ownedNumber } = await supabase
          .from('purchased_numbers')
          .select('user_id')
          .eq('phone_number', toNumber)
          .eq('status', 'active')
          .maybeSingle();

        if (!ownedNumber) {
          console.log('[INBOUND] No owner for number — rejecting:', toNumber);
          await telnyxCallAction(callControlId, 'reject', { cause: 'CALL_REJECTED' });
          return NextResponse.json({ received: true });
        }

        const userId = ownedNumber.user_id as string;

        // Match caller to an existing lead by phone number
        const { data: lead } = await supabase
          .from('leads')
          .select('id, first_name, last_name, company')
          .eq('user_id', userId)
          .eq('phone', fromNumber)
          .is('deleted_at', null)
          .maybeSingle();

        // Create inbound call record (realtime subscription in browser will pick this up)
        const { data: newCall } = await supabase
          .from('calls')
          .insert({
            user_id: userId,
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

        console.log('[INBOUND] Call record created:', newCall?.id, '| lead:', lead?.id ?? 'unknown');

        // Get user routing settings
        const { data: inboundSettings } = await supabase
          .from('user_settings')
          .select('inbound_mode, inbound_forward_number, inbound_ring_seconds')
          .eq('user_id', userId)
          .maybeSingle();

        const mode = (inboundSettings?.inbound_mode as string | null) ?? 'browser';

        if (mode === 'off') {
          await telnyxCallAction(callControlId, 'reject', { cause: 'CALL_REJECTED' });
          console.log('[INBOUND] Rejected (off mode)');
        } else if (mode === 'forward' && inboundSettings?.inbound_forward_number) {
          // Answer then bridge/transfer to user's personal number
          await telnyxCallAction(callControlId, 'answer');
          await new Promise((r) => setTimeout(r, 600));
          await telnyxCallAction(callControlId, 'transfer', {
            to: inboundSettings.inbound_forward_number as string,
            from: toNumber,
          });
          console.log('[INBOUND] Forwarded to:', inboundSettings.inbound_forward_number);
        } else {
          // browser mode (default): Telnyx routes to registered WebRTC SIP endpoint.
          // The frontend popup appears via Supabase realtime subscription on the call record.
          console.log('[INBOUND] Ringing browser for user:', userId);
        }
      } else {
        // ── OUTBOUND CALL (existing upsert logic) ────────────────────────────
        // Use upsert so the row exists even when this webhook fires before
        // /api/calls/dial has created the DB record (common race in WebRTC flow).
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

    // ── call.ringing ────────────────────────────────────────────────────────
    // This confirms the receiver's phone is actually ringing (AMD is disabled)
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
      }
    }

    // ── call.answered ───────────────────────────────────────────────────────
    else if (event_type === 'call.answered') {
      const callRow = await findCall(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.error('[WEBHOOK] call.answered — call not found. session:', callSessionId, '| control:', callControlId);
        return NextResponse.json({ received: true });
      }

      console.log('[WEBHOOK] call.answered — call id:', callRow.id);

      // Update status (also save session ID here as a safety net)
      await supabase
        .from('calls')
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
          ...(callSessionId ? { telnyx_session_id: callSessionId } : {}),
        })
        .eq('id', callRow.id);

      // Check user recording preference
      const { data: settings } = await supabase
        .from('user_settings')
        .select('recording_mode')
        .eq('user_id', callRow.user_id)
        .single();

      const recordingMode = settings?.recording_mode ?? 'always';
      console.log('[WEBHOOK] Recording mode:', recordingMode);

      if (recordingMode !== 'never' && callControlId) {
        // START PROGRAMMATIC RECORDING — triggers call.recording.saved webhook
        const started = await startProgrammaticRecording(callControlId);
        if (started) {
          await supabase.from('calls').update({ was_recorded: true }).eq('id', callRow.id);
        }
      } else if (recordingMode === 'never') {
        console.log('[WEBHOOK] Skipping recording — user set recording_mode=never');
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
      const callRow = await findCall(
        supabase, callSessionId, callControlId,
        'id, user_id, lead_id, answered_at, to_number, from_number, direction, ai_processed, analytics_id, duration_seconds, was_recorded, ai_processing_status',
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

        // Detect missed inbound call (hung up before answered)
        if (callRow.direction === 'inbound' && !callRow.answered_at) {
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
        // Fallback: update by control id without row lookup
        if (callControlId) {
          await supabase
            .from('calls')
            .update({ status: 'completed', ended_at: endedAt, hangup_cause: hangupCause })
            .eq('telnyx_call_id', callControlId);
        }
        console.warn('[WEBHOOK] call.hangup — call not found, updated by control id');
      }
    }

    // ── call.recording.saved ─────────────────────────────────────────────────
    else if (event_type === 'call.recording.saved') {
      const recordingUrl = payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
      console.log('[RECORDING SAVED] URL:', recordingUrl);

      if (!recordingUrl) {
        console.warn('[RECORDING SAVED] No recording URL in payload — skipping');
        return NextResponse.json({ received: true });
      }

      const callRow = await findCall(supabase, callSessionId, callControlId);
      if (!callRow) {
        console.error('[RECORDING SAVED] Call not found. session:', callSessionId, '| control:', callControlId);
        return NextResponse.json({ received: true });
      }

      console.log('[RECORDING SAVED] Call:', callRow.id, '| ai_processing_status:', callRow.ai_processing_status);

      // Idempotency
      if (
        callRow.ai_processed ||
        callRow.analytics_id ||
        callRow.ai_processing_status === 'completed' ||
        callRow.ai_processing_status === 'processing'
      ) {
        console.log('[RECORDING SAVED] Already processed/processing — skipping');
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
        console.log('[RECORDING SAVED] recording_mode=never — skipping');
        return NextResponse.json({ received: true });
      }

      // 30-second minimum rule — recordings under 30s are discarded
      const dur = callRow.duration_seconds ?? 0;
      const MIN_RECORDING_SECONDS = 30;
      if (dur > 0 && dur < MIN_RECORDING_SECONDS) {
        console.log(`[RECORDING SAVED] Call too short (${dur}s < ${MIN_RECORDING_SECONDS}s) — discarding recording`);
        // Mark call as processed without saving recording URL; don't run AI
        await supabase
          .from('calls')
          .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
          .eq('id', callRow.id);
        return NextResponse.json({ received: true });
      }

      // Save URL + mark processing
      await supabase
        .from('calls')
        .update({ recording_url: recordingUrl, ai_processing_status: 'processing' })
        .eq('id', callRow.id);

      // Determine if any AI feature is enabled (default to true when no settings row exists)
      const anyAiEnabled =
        (settings?.ai_auto_transcribe ?? true) ||
        (settings?.ai_auto_summarize ?? true) ||
        (settings?.ai_detect_sentiment ?? true) ||
        (settings?.ai_extract_talking_points ?? true);

      if (anyAiEnabled) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
        console.log('[RECORDING SAVED] Firing AI pipeline for call:', callRow.id, '| baseUrl:', baseUrl);

        // Fire-and-forget — Telnyx needs a fast 200 response
        void fetch(`${baseUrl}/api/ai/process-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
          },
          body: JSON.stringify({ call_id: callRow.id }),
        })
          .then(async (r) => {
            const text = await r.text().catch(() => '');
            console.log('[RECORDING SAVED] AI trigger response:', r.status, text.slice(0, 300));
          })
          .catch((err) => {
            console.error('[RECORDING SAVED] AI trigger error:', err);
          });
      } else {
        console.log('[RECORDING SAVED] All AI settings disabled — recording saved, skipping AI');
        await supabase
          .from('calls')
          .update({ ai_processing_status: 'completed' })
          .eq('id', callRow.id);
      }

      // Ensure bucket exists (async, non-blocking)
      void ensureRecordingsBucket(supabase);

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
