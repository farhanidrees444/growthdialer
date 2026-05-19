import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

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

async function ensureRecordingsBucket(supabase: ReturnType<typeof createServiceClient>) {
  if (!supabase) return;
  try {
    await supabase.storage.createBucket('call-recordings', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'],
    });
    console.log('[WEBHOOK] Created call-recordings bucket');
  } catch {
    // Ignore — bucket already exists
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
        body: JSON.stringify({
          format: 'mp3',
          channels: 'dual',
          play_beep: false,
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[RECORDING] record_start failed:', res.status, errText.slice(0, 200));
      return false;
    }
    console.log('[RECORDING] record_start accepted for call control:', callControlId);
    return true;
  } catch (err) {
    console.error('[RECORDING] record_start exception:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TelnyxWebhookBody = await request.json();
    const event = body.data;

    console.log('[WEBHOOK] Event:', event?.event_type, '| id:', event?.id);

    if (!event?.event_type) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      console.warn('[WEBHOOK] Service client unavailable — skipping persistence');
      return NextResponse.json({ received: true });
    }

    const { event_type, payload } = event;
    const callControlId = payload.call_control_id;

    console.log('[WEBHOOK] Session:', payload.call_session_id, '| Control:', callControlId, '| Type:', event_type);

    if (!callControlId) {
      console.warn('[WEBHOOK] No call_control_id in payload');
      return NextResponse.json({ received: true });
    }

    switch (event_type) {
      // ── call.initiated ──────────────────────────────────────────────────────
      case 'call.initiated': {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'ringing' })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('[WEBHOOK] call.initiated update error:', error);
        console.log('[WEBHOOK] Call ringing:', callControlId);
        break;
      }

      // ── call.answered ───────────────────────────────────────────────────────
      case 'call.answered': {
        const { data: callRow, error: fetchErr } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, to_number')
          .eq('telnyx_call_id', callControlId)
          .single();

        if (fetchErr || !callRow) {
          console.error('[WEBHOOK] call.answered — call not found for control id:', callControlId, fetchErr);
          break;
        }

        console.log('[WEBHOOK] Call answered — id:', callRow.id, '| user:', callRow.user_id);

        // Update call status
        await supabase
          .from('calls')
          .update({ status: 'answered', answered_at: new Date().toISOString() })
          .eq('id', callRow.id);

        // Check user recording preference
        const { data: settings } = await supabase
          .from('user_settings')
          .select('recording_mode')
          .eq('user_id', callRow.user_id)
          .single();

        const recordingMode = settings?.recording_mode ?? 'always';
        console.log('[WEBHOOK] Recording mode:', recordingMode);

        if (recordingMode !== 'never') {
          // START PROGRAMMATIC RECORDING — this causes call.recording.saved to fire
          const started = await startProgrammaticRecording(callControlId);
          if (started) {
            await supabase
              .from('calls')
              .update({ was_recorded: true })
              .eq('id', callRow.id);
          }
        } else {
          console.log('[WEBHOOK] Recording skipped — user set recording_mode=never');
        }

        // Log activity
        await supabase.from('activities').insert({
          user_id: callRow.user_id,
          type: 'call',
          lead_id: callRow.lead_id ?? null,
          description: `Call answered${callRow.lead_id ? '' : ` — ${callRow.to_number ?? 'unknown'}`}`,
          metadata: { event: 'call.answered', call_id: callRow.id, telnyx_call_id: callControlId },
        }).select().maybeSingle();

        break;
      }

      // ── call.hangup ─────────────────────────────────────────────────────────
      case 'call.hangup': {
        const endedAt = new Date().toISOString();
        const { data: existing } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, answered_at, to_number')
          .eq('telnyx_call_id', callControlId)
          .single();

        let durationSeconds: number | null = null;
        if (payload.duration_millis) {
          durationSeconds = Math.round(payload.duration_millis / 1000);
        } else if (payload.duration_seconds) {
          durationSeconds = payload.duration_seconds;
        } else if (existing?.answered_at) {
          durationSeconds = Math.round(
            (new Date(endedAt).getTime() - new Date(existing.answered_at).getTime()) / 1000,
          );
        }

        const hangupCause = payload.hangup_cause ?? null;
        console.log('[WEBHOOK] Call hangup:', callControlId, '| cause:', hangupCause, '| duration:', durationSeconds, 's');

        const { error } = await supabase
          .from('calls')
          .update({
            status: 'completed',
            ended_at: endedAt,
            hangup_cause: hangupCause,
            ...(durationSeconds !== null ? { duration_seconds: durationSeconds } : {}),
          })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('[WEBHOOK] call.hangup update error:', error);

        if (existing?.lead_id) {
          await supabase.from('leads').update({ last_called_at: endedAt }).eq('id', existing.lead_id);
        }

        if (existing?.user_id) {
          const durStr = durationSeconds
            ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`
            : null;
          await supabase.from('activities').insert({
            user_id: existing.user_id,
            type: 'call',
            lead_id: existing.lead_id ?? null,
            description: durStr ? `Call ended — ${durStr}` : `Call ended${hangupCause ? ` (${hangupCause})` : ''}`,
            metadata: { event: 'call.hangup', call_id: existing.id, duration_seconds: durationSeconds, hangup_cause: hangupCause },
          }).select().maybeSingle();
        }
        break;
      }

      // ── call.recording.saved ─────────────────────────────────────────────────
      case 'call.recording.saved': {
        const recordingUrl = payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
        console.log('[RECORDING SAVED] Control:', callControlId);
        console.log('[RECORDING SAVED] URLs:', JSON.stringify(payload.recording_urls));

        if (!recordingUrl) {
          console.warn('[RECORDING SAVED] No recording URL in payload — skipping');
          break;
        }

        // Fetch call record
        const { data: callRow } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, ai_processed, analytics_id, duration_seconds, was_recorded, ai_processing_status')
          .eq('telnyx_call_id', callControlId)
          .single();

        if (!callRow) {
          console.warn('[RECORDING SAVED] Call not found for control id:', callControlId);
          break;
        }

        console.log('[RECORDING SAVED] Call found:', callRow.id, '| ai_processing_status:', callRow.ai_processing_status, '| was_recorded:', callRow.was_recorded);

        // Idempotency
        if (callRow.ai_processed || callRow.analytics_id || callRow.ai_processing_status === 'completed') {
          console.log('[RECORDING SAVED] Already processed — skipping');
          break;
        }

        if (callRow.ai_processing_status === 'processing') {
          console.log('[RECORDING SAVED] Already in-flight — skipping');
          break;
        }

        // Fetch user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize, ai_detect_sentiment, ai_extract_talking_points')
          .eq('user_id', callRow.user_id)
          .single();

        const recordingMode = settings?.recording_mode ?? 'always';
        console.log('[RECORDING SAVED] User recording mode:', recordingMode);

        if (recordingMode === 'never') {
          console.log('[RECORDING SAVED] recording_mode=never — skipping AI processing');
          break;
        }

        // Auto-delete short calls
        const dur = callRow.duration_seconds ?? 0;
        if (settings?.recording_auto_delete_short && dur > 0 && dur < 10) {
          console.log(`[RECORDING SAVED] Short call (${dur}s) — marking recorded but skipping AI`);
          await supabase
            .from('calls')
            .update({ recording_url: recordingUrl, ai_processed: true, ai_processed_at: new Date().toISOString() })
            .eq('id', callRow.id);
          break;
        }

        // Ensure storage bucket exists (async, don't block)
        void ensureRecordingsBucket(supabase);

        // Save recording URL and mark as processing
        await supabase
          .from('calls')
          .update({ recording_url: recordingUrl, ai_processing_status: 'processing' })
          .eq('id', callRow.id);

        console.log('[RECORDING SAVED] Recording URL saved, checking AI settings…');

        const anyAiEnabled =
          settings?.ai_auto_transcribe ||
          settings?.ai_auto_summarize ||
          settings?.ai_detect_sentiment ||
          settings?.ai_extract_talking_points;

        // Default to enabled when user_settings row doesn't exist yet
        const shouldRunAI = anyAiEnabled !== false;

        if (shouldRunAI) {
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ??
            process.env.APP_URL ??
            'http://localhost:3000';
          console.log('[RECORDING SAVED] Triggering AI pipeline at:', baseUrl, '| call:', callRow.id);

          void fetch(`${baseUrl}/api/ai/process-call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
            },
            body: JSON.stringify({ call_id: callRow.id }),
          })
            .then(async (r) => {
              const text = await r.text();
              console.log('[RECORDING SAVED] AI trigger response:', r.status, text.slice(0, 200));
            })
            .catch((err) => {
              console.error('[RECORDING SAVED] AI trigger failed:', err);
            });
        } else {
          console.log('[RECORDING SAVED] All AI settings disabled — recording saved, no AI processing');
          // Still mark as complete so the recording shows up
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
        }).select().maybeSingle();

        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled event:', event_type);
        break;
    }

    return NextResponse.json({ received: true, event_type });
  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
