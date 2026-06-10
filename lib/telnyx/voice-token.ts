import type { SupabaseClient } from '@supabase/supabase-js';

const TELNYX_API = 'https://api.telnyx.com/v2';

async function fetchCredentialToken(credentialId: string): Promise<string | null> {
  const apiKey = process.env.TELNYX_API_KEY?.trim();
  if (!apiKey) {
    console.error('[voice/token] TELNYX_API_KEY is not set');
    return null;
  }

  const res = await fetch(`${TELNYX_API}/telephony_credentials/${credentialId}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error('[voice/token] credential token fetch failed:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const token = (await res.text()).trim();
  return token || null;
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

  if (!res.ok) {
    console.error('[voice/token] create credential failed:', res.status, await res.text().catch(() => ''));
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
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, telnyx_telephony_credential_id: credentialId },
      { onConflict: 'user_id' },
    );
  if (error) {
    console.error('[voice/token] failed to persist credential id:', error.message);
  }
}

async function resolvePerUserCredentialId(
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
    // Stale credential — clear and recreate below
    await saveUserCredentialId(supabase, userId, null);
  }

  const created = await createUserCredential(userId);
  if (!created) return null;

  await saveUserCredentialId(supabase, userId, created);
  return created;
}

export type VoiceTokenResult =
  | { ok: true; kind: 'jwt'; login_token: string }
  | { ok: true; kind: 'sip'; login: string; password: string }
  | { ok: false; status: number; error: string };

/**
 * Issue browser WebRTC credentials.
 * Order matches pre-security builds: shared JWT first (all users), then per-user JWT, then SIP.
 */
export async function issueVoiceLoginToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<VoiceTokenResult> {
  // 1. Shared telephony credential — worked for every account in prior builds
  const sharedCredentialId =
    process.env.TELNYX_TELEPHONY_CREDENTIAL_ID?.trim()
    ?? process.env.TELNYX_CREDENTIAL_ID?.trim();
  if (sharedCredentialId) {
    const token = await fetchCredentialToken(sharedCredentialId);
    if (token) return { ok: true, kind: 'jwt', login_token: token };
  }

  // 2. Per-user credential when connection ID is configured
  if (process.env.TELNYX_CONNECTION_ID?.trim()) {
    const credentialId = await resolvePerUserCredentialId(supabase, userId);
    if (credentialId) {
      const token = await fetchCredentialToken(credentialId);
      if (token) return { ok: true, kind: 'jwt', login_token: token };
    }
  }

  // 3. SIP fallback — restores legacy behavior when JWT paths are unavailable
  const login =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();
  const password = process.env.TELNYX_SIP_PASSWORD?.trim();
  if (login && password) {
    console.warn('[voice/token] using SIP credential fallback');
    return { ok: true, kind: 'sip', login, password };
  }

  return {
    ok: false,
    status: 503,
    error: 'Voice service is not configured — check Telnyx credentials in environment',
  };
}
