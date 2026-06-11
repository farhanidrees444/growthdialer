import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';

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
  const cred = await resolveInboundBrowserCredential(supabase, userId);
  if (!cred) return null;
  return sipUriFromUsername(cred.sipUsername);
}
