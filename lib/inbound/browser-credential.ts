import type { SupabaseClient } from '@supabase/supabase-js';

export interface InboundBrowserCredential {
  credentialId: string;
  sipUsername: string;
  token: string;
}

/** Twilio browser clients use /api/twilio/token — no SIP credential bridge. */
export async function resolveInboundBrowserCredential(
  _supabase: SupabaseClient,
  _userId: string,
): Promise<InboundBrowserCredential | null> {
  return null;
}
