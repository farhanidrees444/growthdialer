import { NextRequest, NextResponse } from 'next/server';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';
import {
  dialStatusCallbackOptions,
  resolveInboundRoute,
  resolveOutboundRoute,
  twilioInboundDialStatusUrl,
  twilioRecordingCallbackUrl,
  twilioStatusCallbackUrl,
} from '@/lib/twilio/webhook-routing';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeE164 } from '@/lib/inbound/phone';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

function recordingDialOptions(recordingEnabled: boolean, recordingCallback: string | undefined) {
  if (!recordingEnabled || !recordingCallback) return {};
  return {
    record: 'record-from-answer-dual' as const,
    recordingStatusCallback: recordingCallback,
    recordingStatusCallbackMethod: 'POST' as const,
    recordingStatusCallbackEvent: ['completed'] as ['completed'],
  };
}

/**
 * POST /api/twilio/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);
    const to = params.To ?? '';
    const from = params.From ?? '';
    const direction = (params.Direction ?? '').toLowerCase();
    const callerIdParam = params.CallerId?.trim() || null;

    const webhookUrl = request.nextUrl.origin + request.nextUrl.pathname;
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      console.error('[TwilioWebhook] Signature validation failed:', verification.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      const err = new VoiceResponse();
      err.say('Voice service is temporarily unavailable.');
      return twimlResponse(err);
    }

    const statusCallback = twilioStatusCallbackUrl();
    const recordingCallback = twilioRecordingCallbackUrl();
    const dialActionUrl = twilioInboundDialStatusUrl();
    const response = new VoiceResponse();
    const clientUserId = parseTwilioClientIdentity(from);

    // Outbound: browser Device.connect({ To, CallerId })
    if (clientUserId || direction.startsWith('outbound')) {
      const route = await resolveOutboundRoute(supabase, from, to, callerIdParam);
      if (!route) {
        console.error('[TwilioWebhook] OUTBOUND route failed', { from, to, callerIdParam });
        response.say('No caller ID is configured for your account.');
        return twimlResponse(response);
      }

      const dial = response.dial({
        callerId: route.callerId,
        ...dialStatusCallbackOptions(statusCallback),
        ...recordingDialOptions(route.routing.recording_enabled, recordingCallback),
      });
      dial.number(route.toNumber);
      return twimlResponse(response);
    }

    // Inbound PSTN
    const inbound = await resolveInboundRoute(supabase, to, from);
    if (!inbound) {
      console.error('[TwilioWebhook] INBOUND no owner for To=', to);
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
          ...recordingDialOptions(routing.recording_enabled, recordingCallback),
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
        recordingStatusCallback: recordingCallback,
        recordingStatusCallbackMethod: 'POST',
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
      ...recordingDialOptions(routing.recording_enabled, recordingCallback),
    });
    dial.client(inbound.clientIdentity);
    return twimlResponse(response);
  } catch (error) {
    console.error('[TwilioWebhook] Exception:', error instanceof Error ? error.message : String(error));
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
