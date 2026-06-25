import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createServiceClient } from '@/lib/supabase/service';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';

export const dynamic = 'force-dynamic';

function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string') params[key] = value;
  });
  return params;
}

export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get('call_id')?.trim();
  const role = request.nextUrl.searchParams.get('role')?.trim() || 'participant';
  if (!callId) return new NextResponse(null, { status: 400 });

  const formData = await request.formData();
  const params = formDataToRecord(formData);
  const signedPath = `/api/twilio/coaching/conference?call_id=${encodeURIComponent(callId)}&role=${encodeURIComponent(role)}`;
  const verification = validateTwilioWebhookRequest(
    request.headers.get('x-twilio-signature'),
    resolveTwilioSignedWebhookUrl(signedPath, request.nextUrl.origin),
    params,
  );
  if (!verification.ok) {
    console.error('[CoachingConferenceTwiML] Signature validation failed:', verification.reason);
    return new NextResponse(null, { status: 403 });
  }

  const conferenceName = `gd-coaching-${callId}`;
  const response = new twilio.twiml.VoiceResponse();
  const dial = response.dial({ answerOnBridge: true });
  dial.conference({
    beep: 'false',
    startConferenceOnEnter: true,
    endConferenceOnExit: false,
    participantLabel: role,
  }, conferenceName);

  const callSid = params.CallSid;
  const service = createServiceClient();
  if (service && callSid) {
    const column = role === 'agent' ? 'agent_participant_sid' : 'prospect_participant_sid';
    await service
      .from('active_calls')
      .update({
        conference_sid: conferenceName,
        [column]: callSid,
        updated_at: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
      })
      .eq('call_id', callId);
  }

  return new NextResponse(response.toString(), {
    status: 200,
    headers: { 'content-type': 'text/xml; charset=utf-8' },
  });
}
