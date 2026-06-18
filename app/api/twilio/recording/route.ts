import { NextRequest, NextResponse } from 'next/server';
import { findCallByTwilioLegs } from '@/lib/twilio/find-call-row';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

/**
 * POST /api/twilio/recording
 * Twilio recording status callback — persist recording_url on calls row.
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

    const recordingUrl = params.RecordingUrl?.trim();
    const callSid = params.CallSid?.trim();
    const parentSid = params.ParentCallSid?.trim();
    const duration = params.RecordingDuration
      ? Number.parseInt(params.RecordingDuration, 10)
      : null;

    if (!recordingUrl || !callSid) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return new NextResponse(null, { status: 204 });
    }

    const row = await findCallByTwilioLegs(supabase, [callSid, parentSid]);
    if (row?.id) {
      await supabase
        .from('calls')
        .update({
          recording_url: recordingUrl,
          was_recorded: true,
          recording_duration_seconds:
            duration != null && !Number.isNaN(duration) ? duration : null,
        })
        .eq('id', row.id);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[TwilioRecording]', error);
    return new NextResponse(null, { status: 204 });
  }
}
