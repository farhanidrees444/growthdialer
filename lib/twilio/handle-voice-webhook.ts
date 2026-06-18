import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';
import {
  dialStatusCallbackOptions,
  resolveInboundRoute,
  resolveOutboundRoute,
  twilioInboundDialStatusUrl,
  twilioStatusCallbackUrl,
} from '@/lib/twilio/webhook-routing';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeE164 } from '@/lib/inbound/phone';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

export function formDataToTwilioParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

function twimlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

/**
 * Shared TwiML voice handler for inbound PSTN, outbound browser, and dialer bridges.
 */
export async function handleTwilioVoiceWebhook(
  request: NextRequest,
  webhookPath: string,
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const params = formDataToTwilioParams(formData);
    const to = params.To ?? '';
    const from = params.From ?? '';
    const direction = (params.Direction ?? '').toLowerCase();
    const callerIdParam = params.CallerId?.trim() || null;

    const webhookUrl = resolveTwilioSignedWebhookUrl(webhookPath, request.nextUrl.origin);
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      console.error('[TwilioVoice] Signature validation failed:', verification.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      const err = new VoiceResponse();
      err.say('Voice service is temporarily unavailable.');
      return twimlResponse(err);
    }

    const statusCallback = twilioStatusCallbackUrl();
    const dialActionUrl = twilioInboundDialStatusUrl();
    const response = new VoiceResponse();
    const clientUserId = parseTwilioClientIdentity(from);
    const outboundTo = params.To?.trim() || params.to?.trim() || '';

    // Outbound: browser Device.connect({ To, CallerId })
    if (clientUserId || direction.startsWith('outbound') || (from.toLowerCase().startsWith('client:') && outboundTo)) {
      const route = await resolveOutboundRoute(supabase, from, outboundTo || to, callerIdParam);
      if (!route) {
        console.error('[TwilioVoice] OUTBOUND route failed', { from, to, callerIdParam });
        response.say('No caller ID is configured for your account.');
        return twimlResponse(response);
      }

      const dial = response.dial({
        callerId: route.callerId,
        ...dialStatusCallbackOptions(statusCallback),
        // TODO: reconnect recording pipeline — Twilio session
      });
      dial.number(route.toNumber);
      return twimlResponse(response);
    }

    // Dialer bridge TwiML — prospect answered, connect agent browser client
    const bridgeUserId = params.gd_user_id?.trim();
    const bridgeIdentity = params.gd_client_identity?.trim();
    if (bridgeUserId && bridgeIdentity) {
      const dial = response.dial();
      dial.client(bridgeIdentity);
      return twimlResponse(response);
    }

    // Inbound PSTN
    const inbound = await resolveInboundRoute(supabase, to, from);
    if (!inbound) {
      console.error('[TwilioVoice] INBOUND no owner for To=', to);
      response.say('This number is not configured to receive calls.');
      return twimlResponse(response);
    }

    const { routing } = inbound;

    if (routing.inbound_mode === 'off') {
      response.reject();
      return twimlResponse(response);
    }

    if (routing.inbound_mode === 'forward' && routing.inbound_forward_number) {
      const forwardTo = normalizeE164(routing.inbound_forward_number);
      if (forwardTo) {
        const dial = response.dial({
          callerId: inbound.fromNumber,
          timeout: routing.inbound_ring_seconds,
          ...dialStatusCallbackOptions(statusCallback),
          // TODO: reconnect recording pipeline — Twilio session
        });
        dial.number(forwardTo);
        return twimlResponse(response);
      }
    }

    if (routing.inbound_mode === 'voicemail') {
      response.say('Please leave a message after the tone.');
      response.record({
        maxLength: 120,
        playBeep: true,
        // TODO: reconnect recording pipeline — Twilio session
      });
      return twimlResponse(response);
    }

    // browser (default) — ring agent client; no-answer → inbound-dial-status
    const dial = response.dial({
      callerId: inbound.fromNumber,
      timeout: Math.min(Math.max(routing.inbound_ring_seconds, 15), 60),
      action: dialActionUrl,
      method: 'POST',
      ...dialStatusCallbackOptions(statusCallback),
      // TODO: reconnect recording pipeline — Twilio session
    });
    dial.client(inbound.clientIdentity);
    return twimlResponse(response);
  } catch (error) {
    console.error('[TwilioVoice] Exception:', error instanceof Error ? error.message : String(error));
    const fallback = new VoiceResponse();
    fallback.say('Sorry, an error occurred. Please try again later.');
    return twimlResponse(fallback);
  }
}

export function twilioVoiceFallbackTwiml(): NextResponse {
  const response = new VoiceResponse();
  response.say('We could not complete your call. Please try again later.');
  response.hangup();
  return twimlResponse(response);
}
