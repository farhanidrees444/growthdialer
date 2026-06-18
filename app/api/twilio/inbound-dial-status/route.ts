import { NextRequest, NextResponse } from 'next/server';
import { syncCallFromTwilioStatus } from '@/lib/twilio/sync-call-from-status';
import { findCallByTwilioLegs } from '@/lib/twilio/find-call-row';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { createServiceClient } from '@/lib/supabase/service';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';
import { twilioRecordingCallbackUrl } from '@/lib/twilio/webhook-routing';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

/**
 * POST /api/twilio/inbound-dial-status
 * After <Dial><Client> completes — route no-answer to voicemail when configured.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);

    const webhookUrl = request.nextUrl.origin + request.nextUrl.pathname;
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);
    if (!verification.ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const dialStatus = (params.DialCallStatus ?? '').toLowerCase();
    const callSid = params.CallSid ?? '';
    const response = new VoiceResponse();

    const supabase = createServiceClient();
    if (supabase) {
      await syncCallFromTwilioStatus(supabase, params);

      if (dialStatus === 'no-answer' || dialStatus === 'busy' || dialStatus === 'failed') {
        const row = await findCallByTwilioLegs(supabase, [callSid, params.DialCallSid]);
        const toNumber = row?.to_number ?? params.To ?? '';
        const owner = toNumber ? await getCachedNumberOwner(supabase, normalizeE164(toNumber)) : null;

        if (owner?.user_id && row?.id) {
          await supabase
            .from('calls')
            .update({
              status: dialStatus === 'no-answer' ? 'missed' : 'failed',
              ended_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          const { data: numRow } = await supabase
            .from('purchased_numbers')
            .select('id')
            .eq('phone_number', normalizeE164(toNumber))
            .limit(1)
            .maybeSingle();

          const routing = await resolveNumberRouting(
            supabase,
            owner.user_id,
            (numRow?.id as string | undefined) ?? undefined,
          );

          if (routing.inbound_mode === 'browser' || routing.inbound_mode === 'forward') {
            const recordingCallback = twilioRecordingCallbackUrl();
            response.say('Please leave a message after the tone.');
            response.record({
              maxLength: 120,
              playBeep: true,
              recordingStatusCallback: recordingCallback,
              recordingStatusCallbackMethod: 'POST',
            });
            return twimlResponse(response);
          }
        }
      }
    }

    response.hangup();
    return twimlResponse(response);
  } catch (error) {
    console.error('[TwilioInboundDialStatus]', error);
    const response = new VoiceResponse();
    response.hangup();
    return twimlResponse(response);
  }
}

function twimlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
