import type { SupabaseClient } from '@supabase/supabase-js';

const TELNYX_API = 'https://api.telnyx.com/v2';

async function fetchCredentialToken(credentialId: string): Promise<string | null> {
  const res = await fetch(`${TELNYX_API}/telephony_credentials/${credentialId}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
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

async function resolveCredentialId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('telnyx_telephony_credential_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (settings?.telnyx_telephony_credential_id) {
    return settings.telnyx_telephony_credential_id as string;
  }

  const created = await createUserCredential(userId);
  if (!created) return null;

  await supabase
    .from('user_settings')
    .update({ telnyx_telephony_credential_id: created })
    .eq('user_id', userId);

  return created;
}

export type VoiceTokenResult =
  | { ok: true; kind: 'jwt'; login_token: string }
  | { ok: true; kind: 'sip'; login: string; password: string }
  | { ok: false; status: number; error: string };

export async function issueVoiceLoginToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<VoiceTokenResult> {
  const isProd = process.env.NODE_ENV === 'production';

  if (process.env.TELNYX_CONNECTION_ID?.trim()) {
    const credentialId = await resolveCredentialId(supabase, userId);
    if (credentialId) {
      const token = await fetchCredentialToken(credentialId);
      if (token) return { ok: true, kind: 'jwt', login_token: token };
    }
  }

  const sharedCredentialId =
    process.env.TELNYX_TELEPHONY_CREDENTIAL_ID ?? process.env.TELNYX_CREDENTIAL_ID;
  if (sharedCredentialId) {
    const token = await fetchCredentialToken(sharedCredentialId);
    if (token) return { ok: true, kind: 'jwt', login_token: token };
  }

  if (!isProd) {
    const login = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME ?? process.env.TELNYX_SIP_USERNAME;
    const password = process.env.TELNYX_SIP_PASSWORD;
    if (login && password) {
      console.warn('[voice/token] dev SIP password fallback — configure TELNYX_CONNECTION_ID for JWT auth');
      return { ok: true, kind: 'sip', login, password };
    }
  }

  return {
    ok: false,
    status: 503,
    error: isProd
      ? 'Voice service is not configured for secure browser login'
      : 'Voice credentials not configured',
  };
}
