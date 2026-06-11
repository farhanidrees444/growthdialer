import {
  readConfiguredConnectionId,
  readTelephonyCredentialId,
  readVoiceApiKey,
} from '@/lib/voice/read-env';

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
  const res = await voiceGet(`telephony_credentials/${credentialId}`, apiKey);
  if (!res.ok) return null;

  const json = await res.json() as { data?: { connection_id?: string | number | null } };
  const id = json.data?.connection_id;
  return id == null ? null : String(id).trim();
}

async function credentialConnectionExists(
  apiKey: string,
  connectionId: string,
): Promise<boolean> {
  const res = await voiceGet(`credential_connections/${connectionId}`, apiKey);
  return res.ok;
}

/**
 * Resolve the SIP credential connection ID used for inbound routing and webhooks.
 * Falls back to the parent connection on the browser telephony credential when env is wrong.
 */
export async function resolveVoiceConnectionId(): Promise<ResolvedVoiceConnection> {
  const apiKey = readVoiceApiKey();
  const fromEnv = readConfiguredConnectionId();
  const credentialId = readTelephonyCredentialId();

  if (!apiKey) {
    return { connectionId: fromEnv, source: fromEnv ? 'env' : 'none', envMismatch: false };
  }

  if (fromEnv && credentialId && fromEnv === credentialId) {
    const resolved = await fetchConnectionIdFromCredential(apiKey, credentialId);
    return {
      connectionId: resolved,
      source: resolved ? 'credential' : 'none',
      envMismatch: true,
    };
  }

  if (fromEnv && await credentialConnectionExists(apiKey, fromEnv)) {
    return { connectionId: fromEnv, source: 'env', envMismatch: false };
  }

  if (credentialId) {
    const resolved = await fetchConnectionIdFromCredential(apiKey, credentialId);
    const envMismatch = Boolean(fromEnv && resolved && fromEnv !== resolved);
    if (resolved) {
      return { connectionId: resolved, source: 'credential', envMismatch };
    }
  }

  return { connectionId: fromEnv, source: fromEnv ? 'env' : 'none', envMismatch: false };
}
