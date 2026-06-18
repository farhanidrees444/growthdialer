import type { SupabaseClient } from '@supabase/supabase-js';
import { findCallByTwilioLegs } from '@/lib/twilio/find-call-row';
import { hangupVoiceCall } from '@/lib/twilio/hangup-call';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';

export interface TwilioDeclineInboundParams {
  callSid: string;
  userId: string;
  reason: 'agent_declined' | 'ring_timeout' | 'caller_hangup';
}

/**
 * Decline inbound call — hang up Twilio legs and mark call missed/declined.
 */
export async function declineTwilioInboundCall(
  supabase: SupabaseClient,
  params: TwilioDeclineInboundParams,
): Promise<{ ok: boolean; status: string; callId?: string }> {
  const callSid = params.callSid.trim();
  if (!isTwilioCallSid(callSid)) {
    return { ok: false, status: 'invalid_sid' };
  }

  const row = await findCallByTwilioLegs(supabase, [callSid]);
  if (!row) {
    try {
      await hangupVoiceCall(callSid);
    } catch {
      /* leg may already be gone */
    }
    return { ok: true, status: params.reason === 'ring_timeout' ? 'missed' : 'declined' };
  }

  if (row.answered_at) {
    return { ok: false, status: row.status };
  }

  const legs = [row.telnyx_call_id, row.telnyx_session_id, row.telnyx_webrtc_leg_id, callSid];
  for (const leg of legs) {
    if (!leg || !isTwilioCallSid(leg)) continue;
    try {
      await hangupVoiceCall(leg);
    } catch {
      /* non-fatal */
    }
  }

  const nextStatus =
    params.reason === 'caller_hangup' || params.reason === 'ring_timeout'
      ? 'missed'
      : 'declined';

  await supabase
    .from('calls')
    .update({
      status: nextStatus,
      ended_at: new Date().toISOString(),
      hangup_cause: params.reason,
    })
    .eq('id', row.id);

  return { ok: true, status: nextStatus, callId: row.id };
}
