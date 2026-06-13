import type { SupabaseClient } from '@supabase/supabase-js';
import {
  dialVoiceLeg,
  telnyxCallAction,
  telnyxCallActionDetailed,
} from '@/lib/inbound/telnyx-actions';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { readVoiceApiKey } from '@/lib/voice/read-env';

import { voiceServerLog } from '@/lib/debug/voice-server-log';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** DB sentinel while a browser-leg dial is in flight (prevents duplicate Telnyx dials). */
export const DIAL_PENDING = 'dial_pending';

export async function waitForBrowserLegId(
  supabase: SupabaseClient,
  dbCallId: string,
  maxMs = 4000,
): Promise<string | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('calls')
      .select('telnyx_webrtc_leg_id')
      .eq('id', dbCallId)
      .maybeSingle();
    const leg = data?.telnyx_webrtc_leg_id ?? null;
    if (leg && leg !== DIAL_PENDING) return leg;
    await sleep(200);
  }
  return null;
}

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
 * Dial the agent's WebRTC leg (Leg B) on accept — PSTN (Leg A) stays on hold until bridge.
 */
export async function ringBrowserForInbound(
  supabase: SupabaseClient,
  userId: string,
  pstnCallControlId: string,
  ownedDid: string,
  callerAni: string,
  dbCallId?: string,
  options?: { forceRedial?: boolean },
): Promise<BridgeResult> {
  if (!readVoiceApiKey()) {
    console.error('[INBOUND] TELNYX_API_KEY is not configured — cannot dial browser');
    return { ok: false, strategy: 'none' };
  }

  // Webhook insert races may call without dbCallId — resolve row by PSTN leg for dedup.
  let resolvedDbCallId = dbCallId;
  if (!resolvedDbCallId) {
    const { data: byPstn } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', pstnCallControlId)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byPstn?.id) resolvedDbCallId = byPstn.id;
  }

  if (resolvedDbCallId) {
    const { data: existing } = await supabase
      .from('calls')
      .select('telnyx_webrtc_leg_id')
      .eq('id', resolvedDbCallId)
      .maybeSingle();
    const leg = existing?.telnyx_webrtc_leg_id ?? null;
    if (leg && !options?.forceRedial) {
      if (leg === DIAL_PENDING) {
        const waited = await waitForBrowserLegId(supabase, resolvedDbCallId, 8000);
        if (waited) {
          console.log('[INBOUND] Browser leg dial completed (waited):', waited);
          return { ok: true, strategy: 'dial_bridge', webrtc_leg_id: waited };
        }
        // Stale in-flight claim — allow this request to take over the dial.
        await supabase
          .from('calls')
          .update({ telnyx_webrtc_leg_id: null })
          .eq('id', resolvedDbCallId)
          .eq('telnyx_webrtc_leg_id', DIAL_PENDING);
        // #region agent log
        voiceServerLog({
          location: 'bridge-to-browser:stalePendingCleared',
          message: 'cleared stale dial_pending — retrying dial',
          data: { dbCallId: resolvedDbCallId },
          hypothesisId: 'H-J',
          runId: 'run9',
        });
        // #endregion
      } else {
        console.log('[INBOUND] Browser leg already queued:', leg);
        return {
          ok: true,
          strategy: 'dial_bridge',
          webrtc_leg_id: leg,
        };
      }
    }
    if (leg && options?.forceRedial) {
      console.log('[INBOUND] Force re-dial — hanging up stale browser leg:', leg);
      if (leg !== DIAL_PENDING) {
        await telnyxCallAction(leg, 'hangup').catch(() => false);
      }
      await supabase
        .from('calls')
        .update({ telnyx_webrtc_leg_id: null })
        .eq('id', resolvedDbCallId);
    }

    // Claim dial — only one concurrent request dials per call row.
    const { data: claimed } = await supabase
      .from('calls')
      .update({ telnyx_webrtc_leg_id: DIAL_PENDING })
      .eq('id', resolvedDbCallId)
      .is('telnyx_webrtc_leg_id', null)
      .select('id')
      .maybeSingle();

    if (!claimed && !options?.forceRedial) {
      const waited = await waitForBrowserLegId(supabase, resolvedDbCallId, 8000);
      if (waited) {
        console.log('[INBOUND] Browser leg claimed by peer (waited):', waited);
        return { ok: true, strategy: 'dial_bridge', webrtc_leg_id: waited };
      }
      const { data: pendingRow } = await supabase
        .from('calls')
        .select('telnyx_webrtc_leg_id')
        .eq('id', resolvedDbCallId)
        .maybeSingle();
      if (pendingRow?.telnyx_webrtc_leg_id === DIAL_PENDING) {
        // #region agent log
        voiceServerLog({
          location: 'bridge-to-browser:skipDuplicateDial',
          message: 'peer dial in flight — skipping duplicate',
          data: { dbCallId: resolvedDbCallId },
          hypothesisId: 'H-H',
          runId: 'run9',
        });
        // #endregion
        return { ok: true, strategy: 'dial_bridge' };
      }
      console.warn('[INBOUND] Browser leg dial in progress but no leg id yet — skipping duplicate dial');
      return { ok: false, strategy: 'none' };
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

  // #region agent log
  voiceServerLog({
    location: 'bridge-to-browser:dialStart',
    message: 'originating browser leg',
    data: { dbCallId: resolvedDbCallId ?? dbCallId, pstnCallControlId },
    hypothesisId: 'H-H',
    runId: 'run9',
  });
  // #endregion

  const dialParams = {
    connectionId: dialAppId,
    to: sipUri,
    from: ownedDid,
    timeoutSecs: 60,
    linkTo: pstnCallControlId,
    clientState: {
      gd_inbound_bridge: true,
      pstn_call_control_id: pstnCallControlId,
      user_id: userId,
      db_call_id: resolvedDbCallId ?? dbCallId ?? null,
      caller_ani: callerAni,
    },
  };

  const dialed = await dialVoiceLeg(dialParams);
  if (!dialed.ok || !dialed.call_control_id) {
    console.warn('[INBOUND] dial WebRTC leg failed:', dialed.detail?.slice(0, 200));
    // #region agent log
    voiceServerLog({
      location: 'bridge-to-browser:dialFailed',
      message: 'browser leg dial failed — no automatic retry (prevents duplicate invites)',
      data: { dbCallId: resolvedDbCallId ?? dbCallId, pstnCallControlId, detail: dialed.detail?.slice(0, 120) },
      hypothesisId: 'H-O',
      runId: 'run9',
    });
    // #endregion
    const callRowId = resolvedDbCallId ?? dbCallId;
    if (callRowId) {
      await supabase
        .from('calls')
        .update({ telnyx_webrtc_leg_id: null })
        .eq('id', callRowId)
        .eq('telnyx_webrtc_leg_id', DIAL_PENDING);
    }
    return { ok: false, strategy: 'none' };
  }

  const webrtcLegId = dialed.call_control_id;

  const callRowId = resolvedDbCallId ?? dbCallId;
  if (callRowId) {
    const { error: legErr } = await supabase
      .from('calls')
      .update({ telnyx_webrtc_leg_id: webrtcLegId })
      .eq('id', callRowId)
      .eq('telnyx_webrtc_leg_id', DIAL_PENDING);
    if (legErr) {
      console.warn('[INBOUND] telnyx_webrtc_leg_id update failed — apply migration 051:', legErr.message);
    }
  }

  console.log('[INBOUND] Browser ring leg created:', webrtcLegId, '| PSTN still ringing:', pstnCallControlId);
  // #region agent log
  voiceServerLog({
    location: 'bridge-to-browser:dialDone',
    message: 'browser leg created',
    data: { dbCallId: callRowId, webrtcLegId },
    hypothesisId: 'H-H',
    runId: 'run9',
  });
  // #endregion
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
