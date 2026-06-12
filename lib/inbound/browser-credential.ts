import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialSipUsername,
  fetchCredentialToken,
  resolvePerUserCredentialId,
} from '@/lib/telnyx/active-credential';

export interface InboundBrowserCredential {
  credentialId: string;
  sipUsername: string;
  token: string;
}

/**
 * Same per-user credential as /api/telnyx/token — required so inbound dial
 * targets the browser session the agent is logged into.
 */
export async function resolveInboundBrowserCredential(
  supabase: SupabaseClient,
  userId: string,
): Promise<InboundBrowserCredential | null> {
  const credentialId = await resolvePerUserCredentialId(supabase, userId);
  if (!credentialId) return null;

  const [token, sipUsername] = await Promise.all([
    fetchCredentialToken(credentialId, { fresh: true, bypassNegativeCache: true }),
    fetchCredentialSipUsername(credentialId),
  ]);

  if (!token || !sipUsername) {
    console.error(
      '[INBOUND] Per-user credential missing token or SIP username | credential:',
      credentialId,
      '| user:',
      userId,
    );
    return null;
  }

  return { credentialId, sipUsername, token };
}
