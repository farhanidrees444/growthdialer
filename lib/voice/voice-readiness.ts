import { getTelephonyProvider } from '@/lib/telephony';
import { readTelephonyPublicKey } from '@/lib/telephony/telnyx/env';
import { readCallControlAppId, readConfiguredConnectionId, readVoiceApiKey } from '@/lib/voice/read-env';

/** True when the active telephony provider has minimum server env for voice. */
export function isVoiceServiceConfigured(): boolean {
  return getTelephonyProvider().isConfigured();
}

export function readVoiceWebhookSignatureReady(): boolean {
  return Boolean(readTelephonyPublicKey()?.trim());
}

export interface VoiceEnvSnapshot {
  configured: boolean;
  apiKey: boolean;
  connectionId: string | null;
  callControlAppId: string | null;
  webhookSignatureReady: boolean;
  provider: 'telnyx';
}

export function snapshotVoiceEnv(): VoiceEnvSnapshot {
  return {
    configured: isVoiceServiceConfigured(),
    apiKey: Boolean(readVoiceApiKey()),
    connectionId: readConfiguredConnectionId(),
    callControlAppId: readCallControlAppId(),
    webhookSignatureReady: readVoiceWebhookSignatureReady(),
    provider: 'telnyx',
  };
}
