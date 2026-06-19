import { NextRequest, NextResponse } from 'next/server';
import { findCallByTwilioLegs } from '@/lib/twilio/find-call-row';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';
import {
  isPlayableRecordingDuration,
  parseRecordingDurationSeconds,
} from '@/lib/recordings/eligibility';
import { triggerMirrorRecordingAsync } from '@/lib/recordings/trigger-mirror';
import { triggerProcessCallAsync } from '@/lib/ai/trigger-process-call';

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

function toPlayableTwilioRecordingUrl(url: string): string {
  if (!url.includes('api.twilio.com') || /\.(mp3|wav)$/i.test(url)) {
    return url;
  }
  return `${url}.mp3`;
}

/**
 * POST /api/twilio/recording
 * Twilio recording status callback — persist and process only playable call recordings.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);

    const webhookUrl = resolveTwilioSignedWebhookUrl('/api/twilio/recording', request.nextUrl.origin);
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const recordingUrl = params.RecordingUrl?.trim()
      ? toPlayableTwilioRecordingUrl(params.RecordingUrl.trim())
      : undefined;
    const callSid = params.CallSid?.trim();
    const parentSid = params.ParentCallSid?.trim();
    const status = params.RecordingStatus?.trim().toLowerCase() ?? '';
    const duration = parseRecordingDurationSeconds(params.RecordingDuration);

    if (!recordingUrl || !callSid) {
      return new NextResponse(null, { status: 204 });
    }

    if (status && status !== 'completed') {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return new NextResponse(null, { status: 204 });
    }

    const row = await findCallByTwilioLegs(supabase, [callSid, parentSid]);
    if (!isPlayableRecordingDuration(duration)) {
      if (row?.id) {
        await supabase
          .from('calls')
          .update({
            was_recorded: false,
            recording_duration_seconds: duration,
            ai_processing_status: 'skipped_short',
          })
          .eq('id', row.id);
      }
      return new NextResponse(null, { status: 204 });
    }

    if (row?.id) {
      await supabase
        .from('calls')
        .update({
          recording_url: recordingUrl,
          was_recorded: true,
          recording_duration_seconds: duration,
          ai_processing_status: 'pending',
        })
        .eq('id', row.id);

      triggerMirrorRecordingAsync(
        row.id,
        row.user_id,
        recordingUrl,
        undefined,
        '[TwilioRecording]',
      );
      triggerProcessCallAsync(row.id, '[TwilioRecording]');
    }

    if (!row?.id) {
      const inboundSid = parentSid ?? callSid;
      await supabase
        .from('inbound_calls')
        .update({
          status: 'voicemail',
          voicemail_recording_url: recordingUrl,
          duration_seconds: duration,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('twilio_call_sid', inboundSid);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[TwilioRecording]', error);
    return new NextResponse(null, { status: 204 });
  }
}
