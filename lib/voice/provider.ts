export type VoiceProvider = 'telnyx';

/** Active voice provider — all call control routes through /lib/telephony. */
export function getVoiceProvider(): VoiceProvider {
  return 'telnyx';
}

export function isTwilioProvider(): boolean {
  return false;
}

export function isTelnyxProvider(): boolean {
  return getVoiceProvider() === 'telnyx';
}
