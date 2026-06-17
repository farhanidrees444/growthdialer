import { readEnv } from '@/lib/voice/read-env';
import { normalizeE164 } from '@/lib/inbound/phone';

export function readTwilioAccountSid(): string | null {
  return readEnv('TWILIO_ACCOUNT_SID');
}

export function readTwilioAuthToken(): string | null {
  return readEnv('TWILIO_AUTH_TOKEN');
}

export function readTwilioTwimlAppSid(): string | null {
  return readEnv('TWILIO_TWIML_APP_SID');
}

export function readTwilioNumber(): string | null {
  const raw = readEnv('TWILIO_NUMBER');
  return raw ? normalizeE164(raw) : null;
}

/** True when core Twilio voice env vars are present on the server. */
export function isTwilioVoiceConfigured(): boolean {
  return Boolean(
    readTwilioAccountSid()
    && readTwilioAuthToken()
    && readTwilioTwimlAppSid()
    && readTwilioNumber(),
  );
}

export function resolveTwilioWebhookUrl(baseUrl?: string): string {
  const base = baseUrl?.replace(/\/$/, '') ?? '';
  return base ? `${base}/api/twilio/webhook` : '';
}
