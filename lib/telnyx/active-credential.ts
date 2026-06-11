import type { SupabaseClient } from '@supabase/supabase-js';
import {
  readConfiguredConnectionId,
  readTelephonyCredentialId,
  readVoiceApiKey,
} from '@/lib/voice/read-env';

const TELNYX_API = 'https://api.telnyx.com/v2';

export async function fetchCredentialToken(credentialId: string): Promise<string | null> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return null;

  const res = await fetch(`${TELNYX_API}/telephony_credentials/${credentialId}/token`, {
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

  const res = await fetch(`${TELNYX_API}/telephony_credentials/${credentialId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;

  const json = await res.json() as { data?: { sip_username?: string } };
  return json.data?.sip_username?.trim() ?? null;
}

async function createUserCredential(userId: string): Promise<string | null> {
  const connectionId = readConfiguredConnectionId();
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

  if (!res.ok) return null;
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

  const created = await createUserCredential(userId);
  if (!created) return null;

  await saveUserCredentialId(supabase, userId, created);
  return created;
}

/** Same credential the browser WebRTC client registers with (shared JWT first, then per-user). */
export async function resolveActiveCredentialId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const sharedCredentialId = readTelephonyCredentialId();

  if (sharedCredentialId) {
    const token = await fetchCredentialToken(sharedCredentialId);
    if (token) return sharedCredentialId;
  }

  if (readConfiguredConnectionId()) {
    return resolvePerUserCredentialId(supabase, userId);
  }

  return null;
}
