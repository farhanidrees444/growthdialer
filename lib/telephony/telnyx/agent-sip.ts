import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialSipUsername,
  resolveActiveCredentialId,
} from '@/lib/telnyx/active-credential';

export function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

export async function resolveAgentSipUri(
  supabase: SupabaseClient,
  agentId: string,
): Promise<{ sipUri: string; sipUsername: string } | null> {
  const credentialId = await resolveActiveCredentialId(supabase, agentId);
  if (!credentialId) return null;

  const sipUsername = await fetchCredentialSipUsername(credentialId);
  if (!sipUsername) return null;

  return {
    sipUsername,
    sipUri: sipUriFromUsername(sipUsername),
  };
}
