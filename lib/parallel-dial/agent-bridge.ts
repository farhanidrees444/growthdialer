/**
 * Bridge a server-dialed prospect leg to the agent's per-user WebRTC endpoint.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';
import { dialVoiceLeg, telnyxCallActionDetailed } from '@/lib/inbound/telnyx-actions';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { voiceApiBearerToken } from '@/lib/voice/read-env';
import { isTwilioProvider } from '@/lib/voice/provider';
import { hangupVoiceCall } from '@/lib/twilio/hangup-call';

export function getAgentBridgeDestination(): string | null {
  const explicit = process.env.TELNYX_AGENT_SIP_URI?.trim();
  if (explicit) return explicit;

  const username = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();
  if (!username) return null;

  return `sip:${username}@sip.telnyx.com`;
}

export async function telnyxCallAction(
  callControlId: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<boolean> {
  const result = await telnyxCallActionDetailed(callControlId, action, body);
  return result.ok;
}

async function bridgeViaSipTransfer(
  prospectCallControlId: string,
  destination: string,
  fromNumber: string,
): Promise<boolean> {
  await telnyxCallAction(prospectCallControlId, 'answer');
  await new Promise((r) => setTimeout(r, 300));
  return telnyxCallAction(prospectCallControlId, 'transfer', {
    to: destination,
    from: fromNumber,
  });
}

/**
 * Nooks-style bridge: answer prospect → dial agent browser leg with link_to +
 * bridge_on_answer so the first live answer reaches the logged-in WebRTC session.
 */
export async function bridgeProspectToAgent(
  supabase: SupabaseClient,
  userId: string,
  prospectCallControlId: string,
  fromNumber: string,
  sessionId?: string,
  legId?: string,
): Promise<boolean> {
  const dialAppId = await getActiveCallControlAppId();
  const cred = await resolveInboundBrowserCredential(supabase, userId);

  if (cred && dialAppId) {
    const answered = await telnyxCallAction(prospectCallControlId, 'answer');
    if (!answered) {
      console.warn('[PARALLEL] prospect answer failed before browser dial');
    }

    const dialed = await dialVoiceLeg({
      connectionId: dialAppId,
      to: `sip:${cred.sipUsername}@sip.telnyx.com`,
      from: fromNumber,
      linkTo: prospectCallControlId,
      timeoutSecs: 60,
      clientState: {
        gd_parallel_bridge: true,
        prospect_call_control_id: prospectCallControlId,
        user_id: userId,
        parallel_session_id: sessionId ?? null,
        parallel_leg_id: legId ?? null,
      },
    });

    if (dialed.ok) {
      console.log('[PARALLEL] WebRTC bridge leg dialed:', dialed.call_control_id);
      return true;
    }
    console.warn('[PARALLEL] WebRTC dial failed — falling back to SIP transfer');
  }

  const destination = getAgentBridgeDestination();
  if (!destination) {
    console.error('[PARALLEL] No agent SIP destination configured');
    return false;
  }

  return bridgeViaSipTransfer(prospectCallControlId, destination, fromNumber);
}

export async function hangupCallControl(callControlId: string): Promise<void> {
  if (isTwilioProvider()) {
    try {
      await hangupVoiceCall(callControlId);
    } catch (err) {
      console.error('[PARALLEL] Twilio hangup exception:', err);
    }
    return;
  }

  try {
    await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${voiceApiBearerToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
  } catch (err) {
    console.error('[PARALLEL] hangup exception:', err);
  }
}
