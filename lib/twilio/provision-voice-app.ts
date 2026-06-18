import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { readTwilioTwimlAppSid } from '@/lib/twilio/voice-config';
import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';

export interface ProvisionVoiceAppResult {
  ok: boolean;
  twiml_app_sid: string | null;
  voice_url: string | null;
  voice_fallback_url: string | null;
  status_callback_url: string | null;
  message: string;
}

/**
 * Align the TwiML App with GrowthDialer voice webhooks (idempotent).
 */
export async function ensureTwilioVoiceAppConfigured(): Promise<ProvisionVoiceAppResult> {
  const twimlAppSid = readTwilioTwimlAppSid();
  const base = resolveVoiceAppBaseUrl();

  if (!twimlAppSid) {
    return {
      ok: false,
      twiml_app_sid: null,
      voice_url: null,
      voice_fallback_url: null,
      status_callback_url: null,
      message: 'TWILIO_TWIML_APP_SID is not configured',
    };
  }

  if (!base) {
    return {
      ok: false,
      twiml_app_sid: twimlAppSid,
      voice_url: null,
      voice_fallback_url: null,
      status_callback_url: null,
      message: 'APP_URL is not configured',
    };
  }

  const client = getTwilioRestClient();
  if (!client) {
    return {
      ok: false,
      twiml_app_sid: twimlAppSid,
      voice_url: null,
      voice_fallback_url: null,
      status_callback_url: null,
      message: 'Twilio credentials are not configured',
    };
  }

  const voiceUrl = `${base}/api/twilio/voice`;
  const voiceFallbackUrl = `${base}/api/twilio/voice-fallback`;
  const statusCallback = `${base}/api/twilio/status-callback`;

  try {
    await client.applications(twimlAppSid).update({
      voiceUrl,
      voiceMethod: 'POST',
      voiceFallbackUrl,
      voiceFallbackMethod: 'POST',
      statusCallback,
      statusCallbackMethod: 'POST',
    });

    return {
      ok: true,
      twiml_app_sid: twimlAppSid,
      voice_url: voiceUrl,
      voice_fallback_url: voiceFallbackUrl,
      status_callback_url: statusCallback,
      message: 'Voice application webhooks updated',
    };
  } catch (err) {
    console.error('[Twilio] voice app provision failed:', err);
    return {
      ok: false,
      twiml_app_sid: twimlAppSid,
      voice_url: voiceUrl,
      voice_fallback_url: voiceFallbackUrl,
      status_callback_url: statusCallback,
      message: err instanceof Error ? err.message : 'Voice application update failed',
    };
  }
}
