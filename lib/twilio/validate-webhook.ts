import twilio from 'twilio';

/**
 * Validate Twilio webhook signature when TWILIO_AUTH_TOKEN is configured.
 * Skips validation in local dev when the token is unset.
 */
export function validateTwilioWebhookRequest(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): { ok: boolean; reason?: string } {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!authToken) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[TwilioWebhook] TWILIO_AUTH_TOKEN not set — rejecting webhook');
      return { ok: false, reason: 'verification_required_no_token' };
    }
    console.warn('[TwilioWebhook] TWILIO_AUTH_TOKEN not set — skipping signature validation');
    return { ok: true, reason: 'verification_skipped_no_token' };
  }

  if (!signature) {
    return { ok: false, reason: 'missing_signature' };
  }

  const valid = twilio.validateRequest(authToken, signature, url, params);
  return valid ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}
