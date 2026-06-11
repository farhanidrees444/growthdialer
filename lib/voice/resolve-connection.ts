import {
  readConfiguredConnectionId,
  readTelephonyCredentialId,
  readVoiceApiKey,
} from '@/lib/voice/read-env';
import {
  credentialConnectionExists,
  fetchCredentialConnectionId,
  fetchCredentialToken,
  telephonyCredentialExists,
} from '@/lib/voice/credential-discovery';

const VOICE_API = 'https://api.telnyx.com/v2';

export type VoiceConnectionSource = 'env' | 'credential' | 'none';

export interface ResolvedVoiceConnection {
  connectionId: string | null;
  source: VoiceConnectionSource;
  /** True when TELNYX_CONNECTION_ID does not match the credential's parent connection. */
  envMismatch: boolean;
}

async function voiceGet(path: string, apiKey: string): Promise<Response> {
  return fetch(`${VOICE_API}/${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export async function fetchConnectionIdFromCredential(
  apiKey: string,
  credentialId: string,
): Promise<string | null> {
  void apiKey;
  return fetchCredentialConnectionId(credentialId);
}

/**
 * Resolve the SIP credential connection used for inbound routing, webhooks, and browser voice.
 */
export async function resolveVoiceConnectionId(): Promise<ResolvedVoiceConnection> {
  const apiKey = readVoiceApiKey();
  const fromEnv = readConfiguredConnectionId();
  const envTelephonySlot = readTelephonyCredentialId();

  if (!apiKey) {
    return { connectionId: fromEnv, source: fromEnv ? 'env' : 'none', envMismatch: false };
  }

  // Common mistake: connection ID pasted into TELNYX_TELEPHONY_CREDENTIAL_ID
  if (envTelephonySlot && await credentialConnectionExists(apiKey, envTelephonySlot)) {
    const envMismatch = Boolean(fromEnv && fromEnv !== envTelephonySlot);
    return { connectionId: envTelephonySlot, source: 'credential', envMismatch };
  }

  if (envTelephonySlot && await telephonyCredentialExists(apiKey, envTelephonySlot)) {
    const parent = await fetchConnectionIdFromCredential(apiKey, envTelephonySlot);
    if (parent) {
      return {
        connectionId: parent,
        source: 'credential',
        envMismatch: Boolean(fromEnv && fromEnv !== parent),
      };
    }
  }

  if (fromEnv && fromEnv === envTelephonySlot) {
    const resolved = envTelephonySlot
      ? await fetchConnectionIdFromCredential(apiKey, envTelephonySlot)
      : null;
    return {
      connectionId: resolved,
      source: resolved ? 'credential' : 'none',
      envMismatch: true,
    };
  }

  if (fromEnv && await credentialConnectionExists(apiKey, fromEnv)) {
    return { connectionId: fromEnv, source: 'env', envMismatch: false };
  }

  return { connectionId: fromEnv, source: fromEnv ? 'env' : 'none', envMismatch: false };
}
