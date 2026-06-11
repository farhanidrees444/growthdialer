import type { SupabaseClient } from '@supabase/supabase-js';
import {
  dialVoiceLeg,
  telnyxCallAction,
  telnyxCallActionDetailed,
} from '@/lib/inbound/telnyx-actions';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { readVoiceApiKey } from '@/lib/voice/read-env';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sipUriFromUsername(username: string): string {
  return `sip:${username}@sip.telnyx.com`;
}

export interface BridgeResult {
  ok: boolean;
  strategy?: 'dial_bridge' | 'transfer' | 'none';
  webrtc_leg_id?: string;
}

async function resolveBrowserSipUri(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ sipUri: string | null; username: string | null; credentialId: string | null }> {
  const cred = await resolveInboundBrowserCredential(supabase, userId);
  if (!cred) {
    return { sipUri: null, username: null, credentialId: null };
  }
  return {
    sipUri: sipUriFromUsername(cred.sipUsername),
    username: cred.sipUsername,
    credentialId: cred.credentialId,
  };
}

/**
 * Ring the browser WebRTC client — do NOT answer PSTN or bridge yet.
 * Caller keeps hearing ring until the agent accepts in the browser.
 */
export async function ringBrowserForInbound(
  supabase: SupabaseClient,
  userId: string,
  pstnCallControlId: string,
  ownedDid: string,
  callerAni: string,
  dbCallId?: string,
): Promise<BridgeResult> {
  if (!readVoiceApiKey()) {
    console.error('[INBOUND] TELNYX_API_KEY is not configured — cannot dial browser');
    return { ok: false, strategy: 'none' };
  }

  if (dbCallId) {
    const { data: existing } = await supabase
      .from('calls')
      .select('telnyx_webrtc_leg_id')
      .eq('id', dbCallId)
      .maybeSingle();
    if (existing?.telnyx_webrtc_leg_id) {
      console.log('[INBOUND] Browser leg already queued:', existing.telnyx_webrtc_leg_id);
      return {
        ok: true,
        strategy: 'dial_bridge',
        webrtc_leg_id: existing.telnyx_webrtc_leg_id,
      };
    }
  }

  const dialAppId = await getActiveCallControlAppId();

  const { sipUri, username, credentialId } = await resolveBrowserSipUri(supabase, userId);

  if (!sipUri || !dialAppId) {
    console.error(
      '[INBOUND] No browser SIP destination or call control app for user:',
      userId,
    );
    return { ok: false, strategy: 'none' };
  }

  console.log('[INBOUND] Ringing browser | call_control_app:', dialAppId, '| credential:', credentialId ?? 'env', '| sip:', username);

  const dialed = await dialVoiceLeg({
    connectionId: dialAppId,
    to: sipUri,
    from: ownedDid,
    timeoutSecs: 60,
    linkTo: pstnCallControlId,
    clientState: {
      gd_inbound_bridge: true,
      pstn_call_control_id: pstnCallControlId,
      user_id: userId,
      db_call_id: dbCallId ?? null,
      caller_ani: callerAni,
    },
  });

  if (!dialed.ok || !dialed.call_control_id) {
    console.warn('[INBOUND] dial WebRTC leg failed:', dialed.detail?.slice(0, 200));
    return { ok: false, strategy: 'none' };
  }

  const webrtcLegId = dialed.call_control_id;

  if (dbCallId) {
    const { error: legErr } = await supabase
      .from('calls')
      .update({ telnyx_webrtc_leg_id: webrtcLegId })
      .eq('id', dbCallId);
    if (legErr) {
      console.warn('[INBOUND] telnyx_webrtc_leg_id update failed — apply migration 051:', legErr.message);
    }
  }

  console.log('[INBOUND] Browser ring leg created:', webrtcLegId, '| PSTN still ringing:', pstnCallControlId);
  return { ok: true, strategy: 'dial_bridge', webrtc_leg_id: webrtcLegId };
}

/**
 * Fallback bridge when auto bridge_on_answer did not connect both legs.
 * PSTN = inbound leg; WebRTC dial leg = outbound (cannot call answer on outbound).
 */
export async function completeInboundBridge(
  pstnCallControlId: string,
  webrtcCallControlId: string,
): Promise<boolean> {
  const tryBridge = async (fromId: string, toId: string) =>
    telnyxCallActionDetailed(fromId, 'bridge', {
      call_control_id_to_bridge_with: toId,
    });

  let bridged = await tryBridge(pstnCallControlId, webrtcCallControlId);
  if (bridged.ok) {
    console.log('[INBOUND] Bridge complete | PSTN:', pstnCallControlId, '| WebRTC:', webrtcCallControlId);
    return true;
  }

  const answerRes = await telnyxCallActionDetailed(pstnCallControlId, 'answer');
  const answerRejectedOutbound =
    answerRes.status === 422
    && (answerRes.detail?.includes('outbound') ?? false);

  if (answerRejectedOutbound) {
    // IDs may be swapped in legacy rows — bridge from the leg that accepts commands.
    bridged = await tryBridge(webrtcCallControlId, pstnCallControlId);
    if (bridged.ok) {
      console.log('[INBOUND] Bridge complete (leg swap) | A:', webrtcCallControlId, '| B:', pstnCallControlId);
      return true;
    }
  } else if (answerRes.ok) {
    await sleep(400);
    bridged = await tryBridge(pstnCallControlId, webrtcCallControlId);
    if (bridged.ok) {
      console.log('[INBOUND] Bridge complete after PSTN answer | PSTN:', pstnCallControlId);
      return true;
    }
  }

  console.error('[INBOUND] Bridge failed:', bridged.detail?.slice(0, 200));
  return false;
}

/**
 * Legacy fallback when browser dial leg cannot be created.
 */
async function bridgeViaTransfer(
  callControlId: string,
  sipUri: string,
  username: string | null,
  fromDid: string,
): Promise<boolean> {
  if (await telnyxCallAction(callControlId, 'transfer', { to: sipUri, from: fromDid })) {
    return true;
  }

  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) return false;

  await sleep(300);

  if (await telnyxCallAction(callControlId, 'transfer', { to: sipUri, from: fromDid })) {
    return true;
  }

  if (username) {
    return telnyxCallAction(callControlId, 'transfer', { to: username, from: fromDid });
  }

  return false;
}

/**
 * Connect inbound PSTN to browser — ring first; bridge completes on WebRTC answer.
 */
export async function bridgeInboundToBrowser(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  callerAni: string,
  ownedDid: string,
  dbCallId?: string,
): Promise<BridgeResult> {
  const ring = await ringBrowserForInbound(
    supabase,
    userId,
    callControlId,
    ownedDid,
    callerAni,
    dbCallId,
  );
  if (ring.ok) return ring;

  const { sipUri, username } = await resolveBrowserSipUri(supabase, userId);
  if (!sipUri) {
    return { ok: false, strategy: 'none' };
  }

  console.log('[INBOUND] Falling back to SIP transfer for user:', userId);
  const transferred = await bridgeViaTransfer(callControlId, sipUri, username, ownedDid);
  return transferred
    ? { ok: true, strategy: 'transfer' }
    : { ok: false, strategy: 'none' };
}
