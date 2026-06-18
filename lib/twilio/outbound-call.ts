import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { twilioStatusCallbackUrl } from '@/lib/twilio/webhook-routing';
import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';

export interface TwilioOutboundCallOptions {
  to: string;
  from: string;
  userId: string;
  machineDetection?: boolean;
  extraQuery?: Record<string, string>;
}

export interface TwilioOutboundCallResult {
  callSid: string | null;
}

/** Originate an outbound PSTN leg via Twilio REST; bridges via /api/twilio/voice on answer. */
export async function createTwilioOutboundCall(
  options: TwilioOutboundCallOptions,
): Promise<TwilioOutboundCallResult> {
  const client = getTwilioRestClient();
  const base = resolveVoiceAppBaseUrl();
  if (!client || !base) {
    throw new Error('Voice service is not configured');
  }

  const identity = toTwilioClientIdentity(options.userId);
  const query = new URLSearchParams({
    gd_user_id: options.userId,
    gd_client_identity: identity,
    ...options.extraQuery,
  });

  const statusCallback = twilioStatusCallbackUrl();

  const call = await client.calls.create({
    to: options.to,
    from: options.from,
    url: `${base}/api/twilio/voice?${query.toString()}`,
    method: 'POST',
    ...(options.machineDetection
      ? {
          machineDetection: 'DetectMessageEnd' as const,
          asyncAmd: 'true' as const,
          asyncAmdStatusCallback: statusCallback,
          asyncAmdStatusCallbackMethod: 'POST' as const,
        }
      : {}),
    ...(statusCallback
      ? {
          statusCallback,
          statusCallbackMethod: 'POST' as const,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'no-answer', 'failed', 'canceled'],
        }
      : {}),
  });

  return { callSid: call.sid ?? null };
}
