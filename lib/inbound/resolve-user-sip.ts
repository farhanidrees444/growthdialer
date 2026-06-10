import type { SupabaseClient } from '@supabase/supabase-js';

const TELNYX_API = 'https://api.telnyx.com/v2';

async function fetchCredentialSipUsername(credentialId: string): Promise<string | null> {
  const apiKey = process.env.TELNYX_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch(`${TELNYX_API}/telephony_credentials/${credentialId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error('[INBOUND] credential lookup failed:', res.status, (await res.text()).slice(0, 200));
    return null;
  }

  const json = await res.json() as { data?: { sip_username?: string } };
  return json.data?.sip_username?.trim() ?? null;
}

async function createUserCredential(userId: string): Promise<string | null> {
  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();
  if (!connectionId) return null;

  const res = await fetch(`${TELNYX_API}/telephony_credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
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

async function resolveCredentialId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('telnyx_telephony_credential_id')
    .eq('user_id', userId)
    .maybeSingle();

  const stored = settings?.telnyx_telephony_credential_id as string | undefined;
  if (stored) return stored;

  const created = await createUserCredential(userId);
  if (!created) return null;

  await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, telnyx_telephony_credential_id: created },
      { onConflict: 'user_id' },
    );

  return created;
}

function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

/**
 * SIP URI for bridging an inbound PSTN leg to this user's browser WebRTC session.
 */
export async function resolveUserSipUri(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const sharedCredentialId =
    process.env.TELNYX_TELEPHONY_CREDENTIAL_ID?.trim()
    ?? process.env.TELNYX_CREDENTIAL_ID?.trim();

  if (sharedCredentialId) {
    const username = await fetchCredentialSipUsername(sharedCredentialId);
    if (username) return sipUriFromUsername(username);
  }

  const credentialId = await resolveCredentialId(supabase, userId);
  if (credentialId) {
    const username = await fetchCredentialSipUsername(credentialId);
    if (username) return sipUriFromUsername(username);
  }

  const envUsername =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();
  if (envUsername) return sipUriFromUsername(envUsername);

  return null;
}
