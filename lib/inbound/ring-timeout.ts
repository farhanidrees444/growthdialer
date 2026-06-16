import type { SupabaseClient } from '@supabase/supabase-js';
import { declineInboundCall } from '@/lib/inbound/inbound-decline-call';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RingTimeoutParams {
  callId: string;
  callControlId: string;
  userId: string;
  ringSeconds: number;
  inboundMode: string;
}

/**
 * After ringSeconds, if inbound is still ringing, run decline logic (voicemail or hangup).
 */
export async function processInboundRingTimeout(
  supabase: SupabaseClient,
  params: RingTimeoutParams,
): Promise<void> {
  const { callId, callControlId, userId, ringSeconds, inboundMode } = params;

  if (!['browser', 'forward'].includes(inboundMode)) return;

  await sleep(Math.max(ringSeconds, 10) * 1000);

  const { data: call } = await supabase
    .from('calls')
    .select('id, status, answered_at, direction')
    .eq('id', callId)
    .maybeSingle();

  if (!call || call.direction !== 'inbound') return;
  if (call.answered_at) return;
  if (call.status !== 'ringing') return;

  console.log('[INBOUND] Ring timeout — declining unanswered call:', callId);

  await declineInboundCall(supabase, {
    callId,
    callControlId,
    userId,
    reason: 'ring_timeout',
  });

  const { data: notifSettings } = await supabase
    .from('user_settings')
    .select('missed_call_notify')
    .eq('user_id', userId)
    .maybeSingle();

  if ((notifSettings?.missed_call_notify as boolean | null) !== false) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'call',
      title: 'Missed call',
      body: 'An inbound caller hung up or was not answered in time',
      metadata: { call_id: callId, event: 'inbound_ring_timeout' },
    }).maybeSingle();
  }
}
