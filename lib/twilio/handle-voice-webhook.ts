import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';
import {
  dialStatusCallbackOptions,
  resolveInboundRoute,
  resolveOutboundRoute,
  twilioInboundDialStatusUrl,
  twilioStatusCallbackUrl,
  twilioVoiceStatusCallbackUrl,
} from '@/lib/twilio/webhook-routing';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveInboundRingTargets } from '@/lib/twilio/resolve-inbound-ring-targets';
import { recordInboundCallStarted } from '@/lib/twilio/sync-inbound-call';
import { twilioRecordingCallbackUrl } from '@/lib/twilio/webhook-routing';
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
    const inboundStatusCallback = twilioVoiceStatusCallbackUrl();
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
    const { data: ownerRow } = await supabase
      .from('purchased_numbers')
      .select('workspace_id')
      .eq('phone_number', inbound.toNumber)
      .neq('status', 'released')
      .limit(1)
      .maybeSingle();
    const inboundWorkspaceId = (ownerRow?.workspace_id as string | undefined) ?? null;

    void recordInboundCallStarted(supabase, {
      callSid: params.CallSid ?? null,
      fromNumber: inbound.fromNumber,
      toNumber: inbound.toNumber,
      routedAgentId: inbound.userId,
    });

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
          ...dialStatusCallbackOptions(inboundStatusCallback),
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

    // browser (default) — presence-aware ring group; no-answer → inbound-dial-status
    const ringTargets = await resolveInboundRingTargets(supabase, {
      primaryUserId: inbound.userId,
      workspaceId: inboundWorkspaceId,
    });

    if (ringTargets.length === 0) {
      const recordingCallback = twilioRecordingCallbackUrl();
      response.say('No agents are available right now. Please leave a message after the tone.');
      response.record({
        maxLength: 120,
        playBeep: true,
        recordingStatusCallback: recordingCallback,
        recordingStatusCallbackMethod: 'POST',
      });
      return twimlResponse(response);
    }

    const dial = response.dial({
      answerOnBridge: true,
      callerId: inbound.fromNumber,
      timeout: Math.min(Math.max(routing.inbound_ring_seconds, 15), 60),
      action: dialActionUrl,
      method: 'POST',
      ...dialStatusCallbackOptions(inboundStatusCallback),
      // TODO: reconnect recording pipeline — Twilio session
    });

    for (const target of ringTargets) {
      const client = dial.client(target.clientIdentity);
      client.parameter({ name: 'gd_from_number', value: inbound.fromNumber });
      client.parameter({ name: 'gd_to_number', value: inbound.toNumber });
    }

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
