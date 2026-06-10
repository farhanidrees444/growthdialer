import type { SupabaseClient } from '@supabase/supabase-js';
import {
  dialVoiceLeg,
  telnyxCallAction,
  telnyxCallActionDetailed,
} from '@/lib/inbound/telnyx-actions';
import {
  fetchCredentialSipUsername,
  resolveActiveCredentialId,
} from '@/lib/telnyx/active-credential';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

export interface BridgeResult {
  ok: boolean;
  strategy?: 'dial_bridge' | 'transfer' | 'none';
  webrtc_leg_id?: string;
}

/**
 * Connect inbound PSTN to the browser WebRTC session the user registered.
 * Primary: dial WebRTC SIP leg + bridge (contact-center pattern).
 * Fallback: answer + SIP transfer.
 */
export async function bridgeInboundToBrowser(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  fromDid: string,
  dbCallId?: string,
): Promise<BridgeResult> {
  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();
  const credentialId = await resolveActiveCredentialId(supabase, userId);
  const sipUsername = credentialId ? await fetchCredentialSipUsername(credentialId) : null;

  const envUsername =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();

  const username = sipUsername ?? envUsername ?? null;
  const sipUri = username ? sipUriFromUsername(username) : null;

  if (!sipUri || !connectionId) {
    console.error('[INBOUND] No browser SIP destination or connection for user:', userId);
    return { ok: false, strategy: 'none' };
  }

  console.log('[INBOUND] Bridging PSTN → browser | credential:', credentialId ?? 'env', '| sip:', username);

  // ── Strategy 1: Dial registered WebRTC endpoint, then bridge legs ──────────
  const dialed = await dialVoiceLeg({
    connectionId,
    to: sipUri,
    from: fromDid,
    timeoutSecs: 45,
    clientState: {
      gd_inbound_bridge: true,
      pstn_call_control_id: callControlId,
      user_id: userId,
      db_call_id: dbCallId ?? null,
    },
  });

  if (dialed.ok && dialed.call_control_id) {
    const webrtcLegId = dialed.call_control_id;

    if (dbCallId) {
      await supabase
        .from('calls')
        .update({ telnyx_session_id: webrtcLegId })
        .eq('id', dbCallId);
    }

    await telnyxCallAction(callControlId, 'answer');
    await sleep(350);

    const bridged = await telnyxCallActionDetailed(callControlId, 'bridge', {
      call_control_id: webrtcLegId,
    });

    if (bridged.ok) {
      console.log('[INBOUND] Browser bridge via dial+bridge OK | webrtc leg:', webrtcLegId);
      return { ok: true, strategy: 'dial_bridge', webrtc_leg_id: webrtcLegId };
    }

    console.warn('[INBOUND] dial+bridge failed — hanging up orphan WebRTC leg, trying transfer');
    await telnyxCallAction(webrtcLegId, 'hangup');
  } else {
    console.warn('[INBOUND] dial WebRTC leg failed:', dialed.detail?.slice(0, 200));
  }

  // ── Strategy 2: Answer + SIP transfer (legacy fallback) ────────────────────
  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) {
    console.error('[INBOUND] answer failed before transfer fallback');
    return { ok: false, strategy: 'none' };
  }

  await sleep(400);

  const transferred = await telnyxCallAction(callControlId, 'transfer', {
    to: sipUri,
    from: fromDid,
  });
  if (transferred) {
    console.log('[INBOUND] Browser bridge via SIP transfer OK');
    return { ok: true, strategy: 'transfer' };
  }

  if (username) {
    const transferredBare = await telnyxCallAction(callControlId, 'transfer', {
      to: username,
      from: fromDid,
    });
    if (transferredBare) {
      console.log('[INBOUND] Browser bridge via username transfer OK');
      return { ok: true, strategy: 'transfer' };
    }
  }

  console.error('[INBOUND] All browser bridge strategies failed for user:', userId);
  return { ok: false, strategy: 'none' };
}
