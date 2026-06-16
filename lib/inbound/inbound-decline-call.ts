import type { SupabaseClient } from '@supabase/supabase-js';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import { DIAL_PENDING } from '@/lib/inbound/bridge-to-browser';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import {
  broadcastIncomingCallEvent,
  type IncomingCallBroadcastPayload,
} from '@/lib/inbound/incoming-calls-broadcast';

export interface InboundDeclineParams {
  callId: string;
  callControlId: string;
  userId: string;
  purchasedNumberId?: string;
  reason: 'agent_declined' | 'ring_timeout' | 'caller_hangup';
}

async function routeLegAToVoicemail(
  supabase: SupabaseClient,
  callControlId: string,
  voicemailMode: boolean,
): Promise<void> {
  await telnyxCallAction(callControlId, 'answer');
  await telnyxCallAction(callControlId, 'record_start', {
    format: 'mp3',
    channels: voicemailMode ? 'single' : 'dual',
    play_beep: voicemailMode,
  });
}

/**
 * Decline / timeout / missed — hangup Leg A or send to voicemail per number settings.
 */
export async function declineInboundCall(
  supabase: SupabaseClient,
  params: InboundDeclineParams,
): Promise<{ ok: boolean; status: string }> {
  const { callId, callControlId, userId, purchasedNumberId, reason } = params;

  const { data: row } = await supabase
    .from('calls')
    .select('id, status, from_number, to_number, telnyx_webrtc_leg_id, answered_at')
    .eq('id', callId)
    .maybeSingle();

  if (!row || row.answered_at) {
    return { ok: false, status: row?.status ?? 'unknown' };
  }

  if (row.status !== 'ringing' && row.status !== 'connecting') {
    return { ok: false, status: row.status ?? 'unknown' };
  }

  const webrtcLeg = row.telnyx_webrtc_leg_id as string | null;
  if (webrtcLeg && webrtcLeg !== DIAL_PENDING) {
    await telnyxCallAction(webrtcLeg, 'hangup').catch(() => false);
  }

  const routing = await resolveNumberRouting(supabase, userId, purchasedNumberId);
  const useVoicemail = routing.inbound_mode === 'voicemail';

  let nextStatus = 'declined';
  if (reason === 'caller_hangup') {
    nextStatus = 'missed';
  } else if (useVoicemail) {
    try {
      await routeLegAToVoicemail(supabase, callControlId, routing.inbound_mode === 'voicemail');
      nextStatus = 'voicemail';
    } catch (err) {
      await telnyxCallAction(callControlId, 'hangup').catch(() => false);
      nextStatus = 'declined';
      await logInboundCallStep(supabase, callControlId, 'agent_declined', {
        telnyx_status: 'error',
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    await telnyxCallAction(callControlId, 'hangup').catch(() => false);
    nextStatus = reason === 'ring_timeout' ? 'missed' : 'declined';
  }

  await supabase
    .from('calls')
    .update({
      status: nextStatus,
      disposition: nextStatus === 'missed' ? 'missed' : nextStatus,
      ended_at: new Date().toISOString(),
      telnyx_webrtc_leg_id: null,
    })
    .eq('id', callId);

  const step = reason === 'ring_timeout' ? 'ring_timeout' : 'agent_declined';
  await logInboundCallStep(supabase, callControlId, step);

  const broadcastEvent =
    reason === 'caller_hangup' || reason === 'ring_timeout' ? 'call_missed' : 'call_declined';

  const payload: IncomingCallBroadcastPayload = {
    call_control_id: callControlId,
    caller_number: row.from_number as string | null,
    call_id: callId,
    to_number: row.to_number as string | null,
    status: nextStatus,
    timestamp: new Date().toISOString(),
  };
  await broadcastIncomingCallEvent(supabase, userId, broadcastEvent, payload);
  await broadcastIncomingCallEvent(supabase, userId, 'call_cleared', payload);

  return { ok: true, status: nextStatus };
}
