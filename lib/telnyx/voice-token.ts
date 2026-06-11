import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';

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

  return {
    ok: false,
    status: 503,
    error: 'Voice service is not configured. Contact your workspace owner.',
  };
}
