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

export async function POST(request: NextRequest) {
  try {
    const body: TelnyxWebhookBody = await request.json();
    const event = body.data;

    if (!event?.event_type) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      console.warn('Webhook received but service client unavailable — skipping persistence');
      return NextResponse.json({ received: true });
    }

    const { event_type, payload } = event;
    const callControlId = payload.call_control_id;

    if (!callControlId) {
      return NextResponse.json({ received: true });
    }

    switch (event_type) {
      case 'call.initiated': {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'ringing' })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('call.initiated update error:', error);
        break;
      }

      case 'call.answered': {
        const { data: callRow, error: fetchErr } = await supabase
          .from('calls')
          .select('id, user_id, lead_id, to_number')
          .eq('telnyx_call_id', callControlId)
          .single();

        if (fetchErr) console.error('call.answered fetch error:', fetchErr);

        const { error } = await supabase
          .from('calls')
          .update({ status: 'answered', answered_at: new Date().toISOString() })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('call.answered update error:', error);

        // Log activity
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
        if (error) console.error('call.hangup update error:', error);

        // Update lead last_called_at if we have a lead_id
        if (existing?.lead_id) {
          await supabase
            .from('leads')
            .update({ last_called_at: endedAt })
            .eq('id', existing.lead_id);
        }

        // Log activity
        if (existing?.user_id) {
          const durStr = durationSeconds ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}` : null;
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
        const recordingUrl =
          payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
        if (recordingUrl) {
          const { data: callRow } = await supabase
            .from('calls')
            .select('id, user_id, lead_id')
            .eq('telnyx_call_id', callControlId)
            .single();

          const { error } = await supabase
            .from('calls')
            .update({ recording_url: recordingUrl })
            .eq('telnyx_call_id', callControlId);
          if (error) console.error('call.recording.saved update error:', error);

          // Log activity
          if (callRow?.user_id) {
            await supabase.from('activities').insert({
              user_id: callRow.user_id,
              type: 'call',
              lead_id: callRow.lead_id ?? null,
              description: 'Recording saved',
              metadata: { event: 'call.recording.saved', call_id: callRow.id, recording_url: recordingUrl },
            }).select().maybeSingle();
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true, event_type });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
