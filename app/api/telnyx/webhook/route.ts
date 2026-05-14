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
      console.warn('Webhook received but Supabase service client unavailable — skipping persistence');
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
        const { error } = await supabase
          .from('calls')
          .update({ status: 'answered', answered_at: new Date().toISOString() })
          .eq('telnyx_call_id', callControlId);
        if (error) console.error('call.answered update error:', error);
        break;
      }

      case 'call.hangup': {
        const endedAt = new Date().toISOString();
        const { data: existing } = await supabase
          .from('calls')
          .select('answered_at, created_at')
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
        break;
      }

      case 'call.recording.saved': {
        const recordingUrl =
          payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
        if (recordingUrl) {
          const { error } = await supabase
            .from('calls')
            .update({ recording_url: recordingUrl })
            .eq('telnyx_call_id', callControlId);
          if (error) console.error('call.recording.saved update error:', error);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true, event_type });
  } catch (error) {
    console.error('Telnyx webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
