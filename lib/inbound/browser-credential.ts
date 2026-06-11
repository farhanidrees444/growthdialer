import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCredentialSipUsername,
  fetchCredentialToken,
  resolveActiveCredentialId,
  resolvePerUserCredentialId,
} from '@/lib/telnyx/active-credential';

export interface InboundBrowserCredential {
  credentialId: string;
  sipUsername: string;
  token: string;
}

/**
 * Credential used for BOTH browser WebRTC login and server-side inbound SIP dial.
 * Per-user credential is required so inbound rings the logged-in agent, not a shared SIP user.
 */
export async function resolveInboundBrowserCredential(
  supabase: SupabaseClient,
  userId: string,
): Promise<InboundBrowserCredential | null> {
  const perUserId = await resolvePerUserCredentialId(supabase, userId);
  if (perUserId) {
    const [token, sipUsername] = await Promise.all([
      fetchCredentialToken(perUserId),
      fetchCredentialSipUsername(perUserId),
    ]);
    if (token && sipUsername) {
      return { credentialId: perUserId, sipUsername, token };
    }
  }

  const sharedId = await resolveActiveCredentialId(supabase, userId);
  if (!sharedId) return null;

  const [token, sipUsername] = await Promise.all([
    fetchCredentialToken(sharedId),
    fetchCredentialSipUsername(sharedId),
  ]);
  if (!token || !sipUsername) {
    console.error(
      '[INBOUND] Voice credential missing token or SIP username | credential:',
      sharedId,
      '| user:',
      userId,
    );
    return null;
  }

  return { credentialId: sharedId, sipUsername, token };
}
