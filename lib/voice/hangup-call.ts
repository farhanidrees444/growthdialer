import { hangupProviderCall } from '@/lib/telephony/telnyx/outbound';

/** End an active voice leg via Telnyx Call Control. */
export async function hangupVoiceCall(callControlId: string): Promise<void> {
  await hangupProviderCall(callControlId);
}
