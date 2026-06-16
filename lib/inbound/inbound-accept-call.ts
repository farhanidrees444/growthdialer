import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTelnyxAnswerFast } from '@/lib/telnyx/fast-answer';
import { ringBrowserForInbound } from '@/lib/inbound/bridge-to-browser';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import {
  broadcastIncomingCallEvent,
  type IncomingCallBroadcastPayload,
} from '@/lib/inbound/incoming-calls-broadcast';

export interface InboundAcceptParams {
  callId: string;
  callControlId: string;
  userId: string;
}

/**
 * Agent accepted: answer Leg A, dial Leg B (manual bridge on Leg B answered).
 */
export async function acceptInboundCall(
  supabase: SupabaseClient,
  params: InboundAcceptParams,
): Promise<{ ok: boolean; webrtc_leg_id?: string | null; error?: string }> {
  const { callId, callControlId, userId } = params;

  const { data: row } = await supabase
    .from('calls')
    .select('id, status, from_number, to_number, telnyx_call_id, telnyx_webrtc_leg_id, answered_at')
    .eq('telnyx_call_id', callControlId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!row || row.id !== callId) {
    return { ok: false, error: 'Call not found' };
  }
  if (row.status !== 'ringing') {
    return { ok: false, error: 'Call is no longer ringing' };
  }
  if (row.answered_at) {
    return { ok: false, error: 'Call already answered' };
  }

  await logInboundCallStep(supabase, callControlId, 'agent_accepted');

  const answerResult = await sendTelnyxAnswerFast(callControlId);
  await logInboundCallStep(
    supabase,
    callControlId,
    'leg_a_answered',
    answerResult.ok
      ? { telnyx_status: 'ok' }
      : { telnyx_status: 'error', error_message: answerResult.errorMessage },
  );

  if (!answerResult.ok) {
    return { ok: false, error: answerResult.errorMessage ?? 'Failed to answer caller' };
  }

  const toNumber = row.to_number as string;
  const fromNumber = (row.from_number as string | null) ?? '';

  const dialResult = await ringBrowserForInbound(
    supabase,
    userId,
    callControlId,
    toNumber,
    fromNumber,
    callId,
    { bridgeOnAnswer: false },
  );

  if (!dialResult.ok || !dialResult.webrtc_leg_id) {
    await logInboundCallStep(supabase, callControlId, 'leg_b_dialed', {
      telnyx_status: 'error',
      error_message: 'Leg B dial failed',
    });
    await telnyxCallAction(callControlId, 'hangup').catch(() => false);
    await supabase
      .from('calls')
      .update({ status: 'failed', ended_at: new Date().toISOString() })
      .eq('id', callId);
    return { ok: false, error: 'Could not reach agent browser line' };
  }

  await logInboundCallStep(supabase, callControlId, 'leg_b_dialed', { telnyx_status: 'ok' });

  await supabase
    .from('calls')
    .update({ status: 'connecting' })
    .eq('id', callId);

  const payload: IncomingCallBroadcastPayload = {
    call_control_id: callControlId,
    caller_number: fromNumber,
    call_id: callId,
    to_number: toNumber,
    status: 'connecting',
    timestamp: new Date().toISOString(),
  };
  await broadcastIncomingCallEvent(supabase, userId, 'call_connecting', payload);

  return { ok: true, webrtc_leg_id: dialResult.webrtc_leg_id };
}
