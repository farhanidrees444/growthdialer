import type { SupabaseClient } from '@supabase/supabase-js';
import { createTwilioOutboundCall } from '@/lib/twilio/outbound-call';
import { hangupVoiceCall } from '@/lib/twilio/hangup-call';
import { handleParallelLegAnswered } from '@/lib/parallel-dial/handle-answered';
import { handleParallelLegAmd } from '@/lib/parallel-dial/handle-amd';
import { syncCallFromTwilioStatus } from '@/lib/twilio/sync-call-from-status';
import { logCallEvent } from '@/lib/webhooks/log-call-event';

const TERMINAL_STATUSES = new Set(['completed', 'busy', 'no-answer', 'failed', 'canceled']);

/**
 * Twilio status / AMD callbacks for parallel dial legs and power sessions.
 * Fire-and-forget safe — never throws.
 */
export async function processTwilioDialerStatusCallback(
  supabase: SupabaseClient,
  params: Record<string, string>,
): Promise<void> {
  const callSid = params.CallSid?.trim();
  if (!callSid) return;

  const callStatus = (params.CallStatus ?? '').toLowerCase();
  const answeredBy = (params.AnsweredBy ?? '').toLowerCase();
  const now = new Date().toISOString();

  void logCallEvent(supabase, {
    call_control_id: callSid,
    event_type: answeredBy ? `amd_${answeredBy}` : `status_${callStatus || 'unknown'}`,
    received_at: now,
    telnyx_status: callStatus || answeredBy || null,
  });

  await syncCallFromTwilioStatus(supabase, params);

  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner, phone, lead_id')
    .eq('telnyx_call_id', callSid)
    .maybeSingle();

  if (leg) {
    if (answeredBy) {
      const amdResult = answeredBy === 'human' ? 'human'
        : answeredBy === 'machine_end_beep' || answeredBy === 'machine_end_silence' || answeredBy === 'machine_start'
          ? 'machine'
          : 'not_sure';
      const { data: callRow } = await supabase
        .from('calls')
        .select('from_number')
        .eq('telnyx_call_id', callSid)
        .maybeSingle();
      await handleParallelLegAmd(supabase, callSid, amdResult, callRow?.from_number ?? null);
      return;
    }

    if (callStatus === 'in-progress' || callStatus === 'answered') {
      const { data: callRow } = await supabase
        .from('calls')
        .select('from_number')
        .eq('telnyx_call_id', callSid)
        .maybeSingle();
      await handleParallelLegAnswered(supabase, callSid, callRow?.from_number ?? null);
      return;
    }

    if (TERMINAL_STATUSES.has(callStatus)) {
      const { handleParallelLegHangup } = await import('@/lib/parallel-dial/handle-answered');
      await handleParallelLegHangup(supabase, callSid, callStatus);
    }
    return;
  }

  // Power dial session — update call row only; client advances queue via disposition
  if (TERMINAL_STATUSES.has(callStatus)) {
    await supabase
      .from('calls')
      .update({
        status: callStatus === 'completed' ? 'completed' : callStatus === 'busy' ? 'failed' : 'missed',
        ended_at: now,
      })
      .eq('telnyx_call_id', callSid)
      .is('ended_at', null);
  }
}

/** Cancel ringing parallel legs via Twilio REST. */
export async function cancelTwilioParallelLegs(
  supabase: SupabaseClient,
  sessionId: string,
  exceptLegId?: string,
): Promise<void> {
  let query = supabase
    .from('parallel_dial_legs')
    .select('id, telnyx_call_id, status')
    .eq('session_id', sessionId)
    .in('status', ['dialing', 'ringing', 'answered']);

  if (exceptLegId) query = query.neq('id', exceptLegId);

  const { data: legs } = await query;
  if (!legs?.length) return;

  await Promise.all(
    legs.map(async (leg) => {
      if (leg.telnyx_call_id) {
        try {
          await hangupVoiceCall(leg.telnyx_call_id);
        } catch (err) {
          console.error('[TwilioParallel] hangup failed:', err);
        }
      }
      await supabase
        .from('parallel_dial_legs')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', leg.id);
    }),
  );
}
