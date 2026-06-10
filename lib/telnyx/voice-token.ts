import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialToken,
  resolveActiveCredentialId,
  resolvePerUserCredentialId,
} from '@/lib/telnyx/active-credential';

export type VoiceTokenResult =
  | { ok: true; kind: 'jwt'; login_token: string }
  | { ok: true; kind: 'sip'; login: string; password: string }
  | { ok: false; status: number; error: string };

/**
 * Issue browser WebRTC credentials.
 * Order: shared JWT first (all users), then per-user JWT, then SIP.
 */
export async function issueVoiceLoginToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<VoiceTokenResult> {
  const activeCredentialId = await resolveActiveCredentialId(supabase, userId);
  if (activeCredentialId) {
    const token = await fetchCredentialToken(activeCredentialId);
    if (token) return { ok: true, kind: 'jwt', login_token: token };
  }

  // Per-user path when shared credential token fetch failed but connection exists
  if (process.env.TELNYX_CONNECTION_ID?.trim()) {
    const credentialId = await resolvePerUserCredentialId(supabase, userId);
    if (credentialId) {
      const token = await fetchCredentialToken(credentialId);
      if (token) return { ok: true, kind: 'jwt', login_token: token };
    }
  }

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
    error: 'Voice service is not configured. Contact your workspace owner.',
  };
}
