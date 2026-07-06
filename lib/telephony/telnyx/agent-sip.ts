import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialSipUsername,
  resolvePerUserCredentialId,
} from '@/lib/telnyx/active-credential';

export function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

/**
 * SIP URI for inbound browser ring — MUST match the per-user credential
 * issued in /api/voice/token (resolvePerUserCredentialId).
 */
export async function resolveAgentSipUri(
  supabase: SupabaseClient,
  agentId: string,
): Promise<{ sipUri: string; sipUsername: string; credentialId: string } | null> {
  const credentialId = await resolvePerUserCredentialId(supabase, agentId);
  if (!credentialId) return null;

  const sipUsername = await fetchCredentialSipUsername(credentialId);
  if (!sipUsername) return null;

  return {
    credentialId,
    sipUsername,
    sipUri: sipUriFromUsername(sipUsername),
  };
}
