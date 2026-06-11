import {
  readConfiguredConnectionId,
  readTelephonyCredentialId,
  readVoiceApiKey,
} from '@/lib/voice/read-env';
import {
  credentialConnectionExists,
  fetchCredentialConnectionId,
  telephonyCredentialExists,
} from '@/lib/voice/credential-discovery';
import {
  getCachedResolvedConnection,
  setCachedResolvedConnection,
} from '@/lib/voice/voice-api-cache';

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
  const cached = getCachedResolvedConnection();
  if (cached?.connectionId) return cached;

  const apiKey = readVoiceApiKey();
  const fromEnv = readConfiguredConnectionId();
  const envTelephonySlot = readTelephonyCredentialId();

  if (!apiKey) {
    const result = { connectionId: fromEnv, source: fromEnv ? 'env' as const : 'none' as const, envMismatch: false };
    if (result.connectionId) setCachedResolvedConnection(result);
    return result;
  }

  if (fromEnv && !envTelephonySlot) {
    const result: ResolvedVoiceConnection = { connectionId: fromEnv, source: 'env', envMismatch: false };
    setCachedResolvedConnection(result);
    return result;
  }

  // Common mistake: connection ID pasted into TELNYX_TELEPHONY_CREDENTIAL_ID
  if (envTelephonySlot && await credentialConnectionExists(apiKey, envTelephonySlot)) {
    const envMismatch = Boolean(fromEnv && fromEnv !== envTelephonySlot);
    const result: ResolvedVoiceConnection = {
      connectionId: envTelephonySlot,
      source: 'credential',
      envMismatch,
    };
    setCachedResolvedConnection(result);
    return result;
  }

  if (envTelephonySlot && await telephonyCredentialExists(apiKey, envTelephonySlot)) {
    const parent = await fetchConnectionIdFromCredential(apiKey, envTelephonySlot);
    if (parent) {
      const result: ResolvedVoiceConnection = {
        connectionId: parent,
        source: 'credential',
        envMismatch: Boolean(fromEnv && fromEnv !== parent),
      };
      setCachedResolvedConnection(result);
      return result;
    }
  }

  if (fromEnv && fromEnv === envTelephonySlot) {
    const resolved = envTelephonySlot
      ? await fetchConnectionIdFromCredential(apiKey, envTelephonySlot)
      : null;
    const result: ResolvedVoiceConnection = {
      connectionId: resolved,
      source: resolved ? 'credential' : 'none',
      envMismatch: true,
    };
    if (result.connectionId) setCachedResolvedConnection(result);
    return result;
  }

  if (fromEnv && await credentialConnectionExists(apiKey, fromEnv)) {
    const result: ResolvedVoiceConnection = { connectionId: fromEnv, source: 'env', envMismatch: false };
    setCachedResolvedConnection(result);
    return result;
  }

  const result: ResolvedVoiceConnection = {
    connectionId: fromEnv,
    source: fromEnv ? 'env' : 'none',
    envMismatch: false,
  };
  if (result.connectionId) setCachedResolvedConnection(result);
  return result;
}
