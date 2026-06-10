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
 * Answer the inbound PSTN leg and connect to the same WebRTC SIP session the user registered.
 */
export async function bridgeInboundToBrowser(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  fromDid: string,
): Promise<boolean> {
  const credentialId = await resolveActiveCredentialId(supabase, userId);
  const sipUsername = credentialId ? await fetchCredentialSipUsername(credentialId) : null;
  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();

  const envUsername =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();

  const sipUri = sipUsername
    ? sipUriFromUsername(sipUsername)
    : envUsername
      ? sipUriFromUsername(envUsername)
      : null;

  if (!sipUri && !sipUsername) {
    console.error('[INBOUND] No browser SIP destination for user:', userId);
    return false;
  }

  console.log('[INBOUND] Bridging PSTN → browser | credential:', credentialId ?? 'env', '| sip:', sipUsername ?? envUsername);

  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) {
    console.error('[INBOUND] answer failed before browser bridge');
    return false;
  }

  await sleep(500);

  // Prefer dial on connection — works best with Call Control apps
  if (connectionId && sipUsername) {
    const dialed = await telnyxCallAction(callControlId, 'dial', {
      connection_id: connectionId,
      to: sipUsername,
      from: fromDid,
    });
    if (dialed) {
      console.log('[INBOUND] Browser bridge via dial OK');
      return true;
    }
    console.warn('[INBOUND] dial failed — trying transfer');
  }

  if (sipUri) {
    const transferred = await telnyxCallAction(callControlId, 'transfer', {
      to: sipUri,
      from: fromDid,
    });
    if (transferred) {
      console.log('[INBOUND] Browser bridge via transfer OK');
      return true;
    }
  }

  console.error('[INBOUND] All browser bridge strategies failed');
  return false;
}
