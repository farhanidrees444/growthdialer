import type { SupabaseClient } from '@supabase/supabase-js';
import type { WebRTCTokenResult } from '@/lib/telephony/types';
import { issueUserWebRtcToken } from '@/lib/telnyx/webrtc-token-engine';

export async function issueWebRtcToken(
  supabase: SupabaseClient,
  agentId: string,
  _tenantId: string,
): Promise<WebRTCTokenResult> {
  const result = await issueUserWebRtcToken(supabase, agentId);
  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    loginToken: result.login_token,
    credentialId: result.credential_id,
    sipUsername: result.sip_username,
  };
}
