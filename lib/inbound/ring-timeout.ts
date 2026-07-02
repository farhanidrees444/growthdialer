import type { SupabaseClient } from '@supabase/supabase-js';
import { advanceInboundRingGroup } from '@/lib/telephony/telnyx/inbound-router';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RingTimeoutParams {
  inboundCallId: string;
  callControlId: string;
  agentId: string;
  ringSeconds: number;
  inboundMode: string;
}

/**
 * After ringSeconds, if inbound is still ringing for this agent, advance ring group.
 */
export async function processInboundRingTimeout(
  supabase: SupabaseClient,
  params: RingTimeoutParams,
): Promise<void> {
  const { inboundCallId, agentId, ringSeconds, inboundMode } = params;

  if (!['browser', 'forward'].includes(inboundMode)) return;

  await sleep(Math.max(ringSeconds, 10) * 1000);

  const { data: inbound } = await supabase
    .from('inbound_calls')
    .select('id, status, answered_at, routed_agent_id')
    .eq('id', inboundCallId)
    .maybeSingle();

  if (!inbound) return;
  if (inbound.answered_at) return;
  if (inbound.status !== 'ringing') return;
  if (inbound.routed_agent_id !== agentId) return;

  console.log('[INBOUND] Ring timeout — advancing ring group:', inboundCallId);

  await advanceInboundRingGroup(supabase, inboundCallId, 'ring_timeout');

  const { data: notifSettings } = await supabase
    .from('user_settings')
    .select('missed_call_notify')
    .eq('user_id', agentId)
    .maybeSingle();

  if ((notifSettings?.missed_call_notify as boolean | null) === false) return;

  const { data: inboundRow } = await supabase
    .from('inbound_calls')
    .select('from_number, status')
    .eq('id', inboundCallId)
    .maybeSingle();

  if (inboundRow?.status === 'missed') {
    await supabase.from('notifications').insert({
      user_id: agentId,
      type: 'call',
      title: 'Missed call',
      body: `Missed inbound call from ${inboundRow.from_number ?? 'unknown'}`,
      metadata: { inbound_call_id: inboundCallId, event: 'inbound_ring_timeout' },
    }).maybeSingle();
  }
}
