import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';

export type VoiceProvider = 'twilio' | 'telnyx';

/**
 * Active voice provider — defaults to Twilio when configured, else Telnyx.
 * Set VOICE_PROVIDER=telnyx to force legacy Telnyx paths.
 */
export function getVoiceProvider(): VoiceProvider {
  const explicit = process.env.VOICE_PROVIDER?.trim().toLowerCase();
  if (explicit === 'twilio' || explicit === 'telnyx') {
    return explicit;
  }
  return isTwilioVoiceConfigured() ? 'twilio' : 'telnyx';
}

export function isTwilioProvider(): boolean {
  return getVoiceProvider() === 'twilio';
}

export function isTelnyxProvider(): boolean {
  return getVoiceProvider() === 'telnyx';
}
