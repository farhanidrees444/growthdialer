import type { SupabaseClient } from '@supabase/supabase-js';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import { resolveUserSipUri } from '@/lib/inbound/resolve-user-sip';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Answer the inbound PSTN leg and transfer to the user's registered WebRTC SIP endpoint.
 */
export async function bridgeInboundToBrowser(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  fromDid: string,
): Promise<boolean> {
  const destination = await resolveUserSipUri(supabase, userId);
  if (!destination) {
    console.error('[INBOUND] No browser SIP destination for user:', userId);
    return false;
  }

  console.log('[INBOUND] Bridging PSTN → browser:', destination);

  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) {
    console.error('[INBOUND] answer failed before browser bridge');
    return false;
  }

  await sleep(400);

  const transferred = await telnyxCallAction(callControlId, 'transfer', {
    to: destination,
    from: fromDid,
  });

  if (!transferred) {
    console.error('[INBOUND] transfer to browser failed');
  }

  return transferred;
}
