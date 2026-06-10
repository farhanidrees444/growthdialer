import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialSipUsername,
  resolveActiveCredentialId,
} from '@/lib/telnyx/active-credential';

function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

/**
 * SIP URI for bridging an inbound PSTN leg to this user's browser WebRTC session.
 * Uses the same credential order as /api/voice/token.
 */
export async function resolveUserSipUri(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const credentialId = await resolveActiveCredentialId(supabase, userId);
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
