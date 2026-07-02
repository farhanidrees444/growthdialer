import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveActiveCredentialId, fetchCredentialSipUsername } from '@/lib/telnyx/active-credential';

export interface InboundBrowserCredential {
  credentialId: string;
  sipUsername: string;
  token: string;
}

export async function resolveInboundBrowserCredential(
  supabase: SupabaseClient,
  userId: string,
): Promise<InboundBrowserCredential | null> {
  const credentialId = await resolveActiveCredentialId(supabase, userId);
  if (!credentialId) return null;

  const sipUsername = await fetchCredentialSipUsername(credentialId);
  if (!sipUsername) return null;

  return {
    credentialId,
    sipUsername,
    token: '',
  };
}
