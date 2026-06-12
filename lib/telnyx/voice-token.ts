import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';
import {
  fetchCredentialToken,
  resolveActiveCredentialId,
} from '@/lib/telnyx/active-credential';

export type VoiceTokenResult =
  | { ok: true; kind: 'jwt'; login_token: string }
  | { ok: true; kind: 'sip'; login: string; password: string }
  | { ok: false; status: number; error: string };

const TOKEN_FETCH_OPTS = { fresh: true, bypassNegativeCache: true } as const;

/**
 * Issue browser WebRTC credentials for outbound dialing.
 * Prefer env/shared JWT (reliable for AI dialer), then per-user inbound cred, then SIP fallback.
 */
export async function issueVoiceLoginToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<VoiceTokenResult> {
  const sharedId = await resolveActiveCredentialId(supabase, userId);
  if (sharedId) {
    const token = await fetchCredentialToken(sharedId, TOKEN_FETCH_OPTS);
    if (token) {
      return { ok: true, kind: 'jwt', login_token: token };
    }
    console.error('[voice/token] shared credential token failed:', sharedId, 'user:', userId);
  }

  const inboundCred = await resolveInboundBrowserCredential(supabase, userId);
  if (inboundCred?.token) {
    return { ok: true, kind: 'jwt', login_token: inboundCred.token };
  }

  const login = process.env.TELNYX_SIP_USERNAME?.trim();
  const password = process.env.TELNYX_SIP_PASSWORD?.trim();
  if (login && password) {
    console.warn('[voice/token] using server SIP fallback — inbound may not ring the browser');
    return { ok: true, kind: 'sip', login, password };
  }

  console.error('[voice/token] no voice credential for user:', userId);
  return {
    ok: false,
    status: 503,
    error: 'Voice service is not configured. Contact your workspace owner.',
  };
}
