import { readVoiceApiKey } from '@/lib/voice/read-env';

const VOICE_API = 'https://api.telnyx.com/v2';

async function voiceGet(path: string, apiKey: string): Promise<Response> {
  return fetch(`${VOICE_API}/${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export async function credentialConnectionExists(
  apiKey: string,
  connectionId: string,
): Promise<boolean> {
  const res = await voiceGet(`credential_connections/${connectionId}`, apiKey);
  return res.ok;
}

export async function telephonyCredentialExists(
  apiKey: string,
  credentialId: string,
): Promise<boolean> {
  const res = await voiceGet(`telephony_credentials/${credentialId}`, apiKey);
  return res.ok;
}

/** List telephony credentials on a SIP credential connection. */
export async function listTelephonyCredentialsForConnection(
  connectionId: string,
): Promise<Array<{ id: string; sip_username: string | null }>> {
  const apiKey = readVoiceApiKey();
  if (!apiKey || !connectionId) return [];

  try {
    const res = await voiceGet(
      `telephony_credentials?filter[connection_id]=${encodeURIComponent(connectionId)}&page[size]=20`,
      apiKey,
    );
    if (!res.ok) return [];

    const json = await res.json() as {
      data?: Array<{ id?: string; sip_username?: string }>;
    };

    return (json.data ?? [])
      .filter((row): row is { id: string; sip_username?: string } => Boolean(row.id))
      .map((row) => ({
        id: row.id,
        sip_username: row.sip_username?.trim() ?? null,
      }));
  } catch {
    return [];
  }
}

export async function fetchCredentialToken(credentialId: string): Promise<string | null> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return null;

  const res = await fetch(`${VOICE_API}/telephony_credentials/${credentialId}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const token = (await res.text()).trim();
  return token || null;
}

export async function fetchCredentialSipUsername(credentialId: string): Promise<string | null> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return null;

  const res = await voiceGet(`telephony_credentials/${credentialId}`, apiKey);
  if (!res.ok) return null;

  const json = await res.json() as { data?: { sip_username?: string } };
  return json.data?.sip_username?.trim() ?? null;
}

/**
 * Resolve a working telephony credential ID.
 * Handles env vars where the connection ID was pasted into the credential slot.
 */
export async function discoverWorkingCredentialId(
  envCredentialOrConnectionId: string | null,
  connectionId: string | null,
): Promise<{ credentialId: string | null; envWasConnectionId: boolean }> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return { credentialId: null, envWasConnectionId: false };

  if (envCredentialOrConnectionId) {
    const token = await fetchCredentialToken(envCredentialOrConnectionId);
    if (token) {
      return { credentialId: envCredentialOrConnectionId, envWasConnectionId: false };
    }

    if (await credentialConnectionExists(apiKey, envCredentialOrConnectionId)) {
      const listed = await listTelephonyCredentialsForConnection(envCredentialOrConnectionId);
      for (const row of listed) {
        const rowToken = await fetchCredentialToken(row.id);
        if (rowToken) {
          return { credentialId: row.id, envWasConnectionId: true };
        }
      }
    }
  }

  if (connectionId) {
    const listed = await listTelephonyCredentialsForConnection(connectionId);
    for (const row of listed) {
      const rowToken = await fetchCredentialToken(row.id);
      if (rowToken) {
        return { credentialId: row.id, envWasConnectionId: false };
      }
    }
  }

  return { credentialId: null, envWasConnectionId: false };
}
