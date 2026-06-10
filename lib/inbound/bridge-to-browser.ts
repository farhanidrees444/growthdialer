import type { SupabaseClient } from '@supabase/supabase-js';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import {
  fetchCredentialSipUsername,
  resolveActiveCredentialId,
} from '@/lib/telnyx/active-credential';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

/**
 * Answer the inbound PSTN leg and connect to the WebRTC SIP session the user registered.
 */
export async function bridgeInboundToBrowser(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  fromDid: string,
): Promise<boolean> {
  const credentialId = await resolveActiveCredentialId(supabase, userId);
  const sipUsername = credentialId ? await fetchCredentialSipUsername(credentialId) : null;

  const envUsername =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();

  const username = sipUsername ?? envUsername ?? null;
  const sipUri = username ? sipUriFromUsername(username) : null;

  if (!sipUri) {
    console.error('[INBOUND] No browser SIP destination for user:', userId);
    return false;
  }

  console.log('[INBOUND] Bridging PSTN → browser | credential:', credentialId ?? 'env', '| sip:', username);

  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) {
    console.error('[INBOUND] answer failed before browser bridge');
    return false;
  }

  await sleep(400);

  const transferred = await telnyxCallAction(callControlId, 'transfer', {
    to: sipUri,
    from: fromDid,
  });
  if (transferred) {
    console.log('[INBOUND] Browser bridge via SIP transfer OK');
    return true;
  }

  const transferredBare = username
    ? await telnyxCallAction(callControlId, 'transfer', { to: username, from: fromDid })
    : false;
  if (transferredBare) {
    console.log('[INBOUND] Browser bridge via username transfer OK');
    return true;
  }

  console.error('[INBOUND] Browser bridge failed for user:', userId);
  return false;
}
