import type { SupabaseClient } from '@supabase/supabase-js';
import { issueUserWebRtcToken } from '@/lib/telnyx/webrtc-token-engine';

export type VoiceTokenResult =
  | { ok: true; kind: 'jwt'; login_token: string; credential_id?: string }
  | { ok: false; status: number; error: string; detail?: string };

/** @deprecated Prefer POST /api/telnyx/token — kept for backward compatibility. */
export async function issueVoiceLoginToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<VoiceTokenResult> {
  const result = await issueUserWebRtcToken(supabase, userId);
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      detail: result.detail,
    };
  }
  return {
    ok: true,
    kind: 'jwt',
    login_token: result.login_token,
    credential_id: result.credential_id,
  };
}
