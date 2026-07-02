import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';

export interface InboundCallAgentRow {
  id: string;
  routed_agent_id: string | null;
  status: string;
}

export async function resolveInboundCallForAgent(
  supabase: SupabaseClient,
  userId: string,
  body: {
    inbound_call_id?: string;
    provider_call_id?: string;
    from_number?: string;
    to_number?: string;
  },
): Promise<InboundCallAgentRow | null> {
  if (body.inbound_call_id) {
    const { data } = await supabase
      .from('inbound_calls')
      .select('id, routed_agent_id, status')
      .eq('id', body.inbound_call_id)
      .maybeSingle();
    return data as InboundCallAgentRow | null;
  }

  if (body.provider_call_id) {
    const { data } = await supabase
      .from('inbound_calls')
      .select('id, routed_agent_id, status')
      .eq('provider_call_id', body.provider_call_id)
      .maybeSingle();
    return data as InboundCallAgentRow | null;
  }

  const from = body.from_number ? normalizeE164(body.from_number) : null;
  const to = body.to_number ? normalizeE164(body.to_number) : null;
  if (!from || !to) return null;

  const { data } = await supabase
    .from('inbound_calls')
    .select('id, routed_agent_id, status')
    .eq('routed_agent_id', userId)
    .eq('status', 'ringing')
    .eq('from_number', from)
    .eq('to_number', to)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as InboundCallAgentRow | null;
}

export function assertAgentMayActOnInbound(
  inbound: InboundCallAgentRow,
  userId: string,
): boolean {
  return !inbound.routed_agent_id || inbound.routed_agent_id === userId;
}
