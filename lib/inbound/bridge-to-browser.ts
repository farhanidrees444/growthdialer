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
import { getActiveVoiceConnectionId } from '@/lib/voice/configure-connection';

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
  const credentialId = await resolveActiveCredentialId(supabase, userId);
  const sipUsername = credentialId ? await fetchCredentialSipUsername(credentialId) : null;
  const envUsername =
    process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();
  const username = sipUsername ?? envUsername ?? null;
  const sipUri = username ? sipUriFromUsername(username) : null;
  return { sipUri, username, credentialId };
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
  const connectionId = await getActiveVoiceConnectionId();
  const { sipUri, username, credentialId } = await resolveBrowserSipUri(supabase, userId);

  if (!sipUri || !connectionId) {
    console.error('[INBOUND] No browser SIP destination or connection for user:', userId);
    return { ok: false, strategy: 'none' };
  }

  console.log('[INBOUND] Ringing browser | credential:', credentialId ?? 'env', '| sip:', username);

  const dialed = await dialVoiceLeg({
    connectionId,
    to: sipUri,
    from: ownedDid,
    timeoutSecs: 60,
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
    await supabase
      .from('calls')
      .update({ telnyx_session_id: webrtcLegId })
      .eq('id', dbCallId);
  }

  console.log('[INBOUND] Browser ring leg created:', webrtcLegId, '| PSTN still ringing:', pstnCallControlId);
  return { ok: true, strategy: 'dial_bridge', webrtc_leg_id: webrtcLegId };
}

/**
 * After the browser answers the WebRTC leg, answer PSTN and bridge both legs.
 */
export async function completeInboundBridge(
  pstnCallControlId: string,
  webrtcCallControlId: string,
): Promise<boolean> {
  await telnyxCallAction(pstnCallControlId, 'answer');
  await sleep(400);

  const bridged = await telnyxCallActionDetailed(pstnCallControlId, 'bridge', {
    call_control_id: webrtcCallControlId,
  });

  if (bridged.ok) {
    console.log('[INBOUND] Bridge complete | PSTN:', pstnCallControlId, '| WebRTC:', webrtcCallControlId);
    return true;
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
  const answered = await telnyxCallAction(callControlId, 'answer');
  if (!answered) return false;

  await sleep(400);

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
