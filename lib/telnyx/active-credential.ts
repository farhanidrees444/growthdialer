import type { SupabaseClient } from '@supabase/supabase-js';
import {
  discoverWorkingCredentialId,
  fetchCredentialSipUsername,
  fetchCredentialToken,
} from '@/lib/voice/credential-discovery';
import {
  readConfiguredConnectionId,
  readTelephonyCredentialId,
  readVoiceApiKey,
} from '@/lib/voice/read-env';
import { getActiveVoiceConnectionId } from '@/lib/voice/configure-connection';

const TELNYX_API = 'https://api.telnyx.com/v2';

export { fetchCredentialToken, fetchCredentialSipUsername };

async function createUserCredential(userId: string, connectionId: string): Promise<string | null> {
  const apiKey = readVoiceApiKey();
  if (!connectionId || !apiKey) return null;

  const res = await fetch(`${TELNYX_API}/telephony_credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connection_id: connectionId,
      name: `gd-${userId.slice(0, 8)}`,
    }),
  });

  if (!res.ok) {
    console.error('[VOICE] create credential failed:', res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const json = await res.json() as { data?: { id?: string } };
  return json.data?.id ?? null;
}

async function saveUserCredentialId(
  supabase: SupabaseClient,
  userId: string,
  credentialId: string | null,
): Promise<void> {
  await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, telnyx_telephony_credential_id: credentialId },
      { onConflict: 'user_id' },
    );
}

export async function resolvePerUserCredentialId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const connectionId = await getActiveVoiceConnectionId();
  if (!connectionId) return null;

  const { data: settings } = await supabase
    .from('user_settings')
    .select('telnyx_telephony_credential_id')
    .eq('user_id', userId)
    .maybeSingle();

  const stored = settings?.telnyx_telephony_credential_id as string | undefined;
  if (stored) {
    const token = await fetchCredentialToken(stored);
    if (token) return stored;
    await saveUserCredentialId(supabase, userId, null);
  }

  const envCredentialId = readTelephonyCredentialId();
  if (envCredentialId) return envCredentialId;

  const created = await createUserCredential(userId, connectionId);
  if (!created) return null;

  await saveUserCredentialId(supabase, userId, created);
  return created;
}

/** Credential the browser WebRTC client and inbound SIP dial leg must share. */
export async function resolveActiveCredentialId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const envCredentialId = readTelephonyCredentialId();
  const connectionId = await getActiveVoiceConnectionId();

  if (envCredentialId) {
    const token = await fetchCredentialToken(envCredentialId);
    if (token) return envCredentialId;
  }

  const discovered = await discoverWorkingCredentialId(
    envCredentialId,
    connectionId,
  );

  if (discovered.credentialId) {
    if (discovered.envWasConnectionId) {
      console.warn(
        '[VOICE] TELNYX_TELEPHONY_CREDENTIAL_ID holds a connection ID — using credential',
        discovered.credentialId,
        'on connection',
        connectionId,
      );
    }
    return discovered.credentialId;
  }

  if (envCredentialId) {
    console.warn('[VOICE] Using configured credential ID without token verification');
    return envCredentialId;
  }

  if (connectionId || readConfiguredConnectionId()) {
    return resolvePerUserCredentialId(supabase, userId);
  }

  return null;
}
