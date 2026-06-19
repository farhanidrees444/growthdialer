export type VoiceProvider = 'twilio';

/**
 * Active voice provider.
 * GrowthDialer is Twilio-only; legacy provider env vars must not steer call routing.
 */
export function getVoiceProvider(): VoiceProvider {
  return 'twilio';
}

export function isTwilioProvider(): boolean {
  return getVoiceProvider() === 'twilio';
}

export function isTelnyxProvider(): boolean {
  return false;
}
