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
    // Ignore — bucket likely already exists
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TelnyxWebhookBody = await request.json();
    const event = body.data;

    console.log('[WEBHOOK] Received event:', event?.event_type, '| id:', event?.id);

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

    console.log('[WEBHOOK] Call session:', payload.call_session_id, '| Control ID:', callControlId);

    if (!callControlId) {
      return NextResponse.json({ received: true });
    }

    switch (event_type) {
      case 'call.initiated': {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'ringing' })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('[WEBHOOK] call.initiated update error:', error);
        break;
      }

      case 'call.answered': {
        const { data: callRow, error: fetchErr } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, to_number')
          .eq('telnyx_call_id', callControlId)
          .single();

        if (fetchErr) console.error('[WEBHOOK] call.answered fetch error:', fetchErr);

        const { error } = await supabase
          .from('calls')
          .update({ status: 'answered', answered_at: new Date().toISOString(), was_recorded: true })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('[WEBHOOK] call.answered update error:', error);

        if (callRow?.user_id) {
          await supabase.from('activities').insert({
            user_id: callRow.user_id,
            type: 'call',
            lead_id: callRow.lead_id ?? null,
            description: `Call answered${callRow.lead_id ? '' : ` — ${callRow.to_number ?? 'unknown'}`}`,
            metadata: { event: 'call.answered', call_id: callRow.id, telnyx_call_id: callControlId },
          }).select().maybeSingle();
        }
        break;
      }

      case 'call.hangup': {
        const endedAt = new Date().toISOString();
        const { data: existing } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, answered_at, created_at, to_number')
          .eq('telnyx_call_id', callControlId)
          .single();

        let durationSeconds: number | null = null;
        if (payload.duration_millis) {
          durationSeconds = Math.round(payload.duration_millis / 1000);
        } else if (existing?.answered_at) {
          durationSeconds = Math.round(
            (new Date(endedAt).getTime() - new Date(existing.answered_at).getTime()) / 1000,
          );
        }

        const { error } = await supabase
          .from('calls')
          .update({
            status: 'completed',
            ended_at: endedAt,
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
            description: durStr ? `Call ended — ${durStr}` : 'Call ended',
            metadata: { event: 'call.hangup', call_id: existing.id, duration_seconds: durationSeconds, telnyx_call_id: callControlId },
          }).select().maybeSingle();
        }
        break;
      }

      case 'call.recording.saved': {
        const recordingUrl = payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
        console.log('[WEBHOOK] Recording URLs:', JSON.stringify(payload.recording_urls));

        if (!recordingUrl) {
          console.warn('[WEBHOOK] call.recording.saved with no recording URL');
          break;
        }

        // Fetch call + check idempotency
        const { data: callRow } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, ai_processed, analytics_id, duration_seconds, was_recorded')
          .eq('telnyx_call_id', callControlId)
          .single();

        if (!callRow) {
          console.warn('[WEBHOOK] call.recording.saved: call not found for', callControlId);
          break;
        }

        console.log('[WEBHOOK] Call found:', callRow.id, '| ai_processed:', callRow.ai_processed, '| was_recorded:', callRow.was_recorded);

        // Idempotency: skip if already processed
        if (callRow.ai_processed || callRow.analytics_id) {
          console.log('[WEBHOOK] Already processed — skipping');
          break;
        }

        // Fetch user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize, ai_detect_sentiment, ai_extract_talking_points')
          .eq('user_id', callRow.user_id)
          .single();

        const recordingMode = settings?.recording_mode ?? 'always';
        console.log('[WEBHOOK] User recording mode:', recordingMode);

        // Respect recording_mode setting
        if (recordingMode === 'never') {
          console.log('[WEBHOOK] Recording mode=never — skipping AI processing');
          break;
        }

        if (recordingMode === 'manual' && !callRow.was_recorded) {
          console.log('[WEBHOOK] Recording mode=manual but was_recorded=false — skipping');
          break;
        }

        // Auto-delete calls under 10 seconds
        const dur = callRow.duration_seconds ?? 0;
        if (settings?.recording_auto_delete_short && dur < 10) {
          console.log(`[WEBHOOK] Short call (${dur}s) — skipping AI processing`);
          await supabase
            .from('calls')
            .update({ recording_url: recordingUrl, ai_processed: true, ai_processed_at: new Date().toISOString() })
            .eq('id', callRow.id);
          break;
        }

        // Ensure storage bucket exists
        void ensureRecordingsBucket(supabase);

        // Save recording URL immediately
        await supabase
          .from('calls')
          .update({ recording_url: recordingUrl })
          .eq('id', callRow.id);

        // Log activity
        await supabase.from('activities').insert({
          user_id: callRow.user_id,
          type: 'call',
          lead_id: callRow.lead_id ?? null,
          description: 'Recording saved',
          metadata: { event: 'call.recording.saved', call_id: callRow.id, recording_url: recordingUrl },
        }).select().maybeSingle();

        // Fire AI processing if any AI setting is enabled
        const anyAiEnabled =
          settings?.ai_auto_transcribe ||
          settings?.ai_auto_summarize ||
          settings?.ai_detect_sentiment ||
          settings?.ai_extract_talking_points;

        if (process.env.AI_PROCESSING_ENABLED === 'true' && anyAiEnabled) {
          const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';
          console.log('[WEBHOOK] Firing AI processing for call:', callRow.id);
          void fetch(`${baseUrl}/api/ai/process-call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
            },
            body: JSON.stringify({ call_id: callRow.id }),
          }).catch((err) => console.error('[WEBHOOK] AI processing trigger failed:', err));
        } else {
          console.log('[WEBHOOK] AI processing disabled — AI_PROCESSING_ENABLED:', process.env.AI_PROCESSING_ENABLED);
        }
        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event_type);
        break;
    }

    return NextResponse.json({ received: true, event_type });
  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
