import type { SupabaseClient } from '@supabase/supabase-js';
import { advanceInboundRingGroup } from '@/lib/telephony/telnyx/inbound-router';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RingTimeoutParams {
  telnyxSessionId: string;
  callControlId: string;
  agentId: string;
  ringSeconds: number;
  inboundMode: string;
}

export async function processInboundRingTimeout(
  supabase: SupabaseClient,
  params: RingTimeoutParams,
): Promise<void> {
  const { telnyxSessionId, agentId, ringSeconds, inboundMode } = params;

  if (!['browser', 'forward'].includes(inboundMode)) return;

  await sleep(Math.max(ringSeconds, 10) * 1000);

  const { data: call } = await supabase
    .from('calls')
    .select('id, status, answered_at, user_id, from_number')
    .eq('telnyx_session_id', telnyxSessionId)
    .eq('direction', 'inbound')
    .maybeSingle();

  if (!call) return;
  if (call.answered_at) return;
  if (call.status !== 'ringing') return;
  if (call.user_id !== agentId) return;

  console.log('[INBOUND-RING] timeout — advancing ring group', telnyxSessionId);

  await advanceInboundRingGroup(supabase, telnyxSessionId, 'ring_timeout');

  const { data: notifSettings } = await supabase
    .from('user_settings')
    .select('missed_call_notify')
    .eq('user_id', agentId)
    .maybeSingle();

  if ((notifSettings?.missed_call_notify as boolean | null) === false) return;

  const { data: refreshed } = await supabase
    .from('calls')
    .select('status, from_number')
    .eq('id', call.id)
    .maybeSingle();

  if (refreshed?.status === 'missed') {
    await supabase.from('notifications').insert({
      user_id: agentId,
      type: 'call',
      title: 'Missed call',
      body: `Missed inbound call from ${refreshed.from_number ?? 'unknown'}`,
      metadata: { telnyx_session_id: telnyxSessionId, event: 'inbound_ring_timeout' },
    }).maybeSingle();
  }
}
