import { NextRequest, NextResponse } from 'next/server';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';
import {
  resolveInboundRoute,
  resolveOutboundRoute,
  twilioStatusCallbackUrl,
} from '@/lib/twilio/webhook-routing';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { createServiceClient } from '@/lib/supabase/service';
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
 * POST /api/twilio/webhook
 *
 * Multi-tenant TwiML App voice URL:
 *   - Inbound PSTN to a purchased DID → ring that account's browser Client
 *   - Outbound browser connect → dial PSTN with the user's default caller ID
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);
    const to = params.To ?? '';
    const from = params.From ?? '';
    const direction = (params.Direction ?? '').toLowerCase();

    const webhookUrl = request.nextUrl.origin + request.nextUrl.pathname;
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      console.error('[TwilioWebhook] Signature validation failed:', verification.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      console.error('[TwilioWebhook] Service client unavailable');
      const err = new VoiceResponse();
      err.say('Voice service is temporarily unavailable.');
      return twimlResponse(err);
    }

    const statusCallback = twilioStatusCallbackUrl();
    const response = new VoiceResponse();
    const clientUserId = parseTwilioClientIdentity(from);

    // Outbound: browser Device.connect({ To }) — From is client:gd_<userId>
    if (clientUserId || direction.startsWith('outbound')) {
      const route = await resolveOutboundRoute(supabase, from, to);
      if (!route) {
        console.error('[TwilioWebhook] OUTBOUND route failed', { from, to });
        response.say('No caller ID is configured for your account. Add a voice line in settings.');
        return twimlResponse(response);
      }

      console.log(
        `[TwilioWebhook] OUTBOUND user=${route.userId} to=${route.toNumber} from=${route.callerId}`,
      );
      const dial = response.dial({
        callerId: route.callerId,
        ...(statusCallback ? { statusCallback, statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'] } : {}),
      });
      dial.number(route.toNumber);
      return twimlResponse(response);
    }

    // Inbound PSTN → browser client for the DID owner
    const inbound = await resolveInboundRoute(supabase, to, from);
    if (!inbound) {
      console.error('[TwilioWebhook] INBOUND no owner for To=', to);
      response.say('This number is not configured to receive calls.');
      return twimlResponse(response);
    }

    console.log(
      `[TwilioWebhook] INBOUND user=${inbound.userId} client=${inbound.clientIdentity} from=${inbound.fromNumber}`,
    );
    const dial = response.dial({
      callerId: inbound.fromNumber,
      timeout: 30,
      ...(statusCallback ? { statusCallback, statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'] } : {}),
    });
    dial.client(inbound.clientIdentity);
    return twimlResponse(response);
  } catch (error) {
    console.error(
      '[TwilioWebhook] Exception:',
      error instanceof Error ? error.message : String(error),
    );

    const fallback = new VoiceResponse();
    fallback.say('Sorry, an error occurred. Please try again later.');
    return twimlResponse(fallback);
  }
}

function twimlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
