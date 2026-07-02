import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

const RINGABLE_HEARTBEAT_MS = 45_000;

export interface InboundRouteTarget {
  agentId: string;
  sipUsername: string;
}

export async function resolveWorkspaceForDid(
  supabase: SupabaseClient,
  did: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('purchased_numbers')
    .select('workspace_id')
    .eq('phone_number', did)
    .eq('status', 'active')
    .maybeSingle();
  return data?.workspace_id ?? null;
}

export async function listRingableAgents(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - RINGABLE_HEARTBEAT_MS).toISOString();
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId);

  const memberIds = (members ?? []).map((row) => row.user_id).filter(Boolean);
  if (!memberIds.length) return [];

  const { data: presence } = await supabase
    .from('agent_presence')
    .select('agent_id, status, last_heartbeat_at')
    .in('agent_id', memberIds)
    .neq('status', 'offline')
    .gte('last_heartbeat_at', cutoff)
    .order('last_heartbeat_at', { ascending: false });

  return (presence ?? []).map((row) => row.agent_id);
}

export async function createInboundCallRow(input: {
  workspaceId: string | null;
  providerCallId: string;
  fromNumber: string;
  toNumber: string;
  routedAgentId?: string | null;
}): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('inbound_calls')
    .insert({
      workspace_id: input.workspaceId,
      provider_call_id: input.providerCallId,
      twilio_call_sid: input.providerCallId,
      from_number: input.fromNumber,
      to_number: input.toNumber,
      routed_agent_id: input.routedAgentId ?? null,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[telephony/inbound] insert failed:', error);
    return null;
  }

  if (data?.id) {
    await recordInboundTransition({
      inboundCallId: data.id,
      workspaceId: input.workspaceId,
      fromStatus: null,
      toStatus: 'ringing',
      reason: 'call.initiated',
      agentId: input.routedAgentId ?? null,
    });
  }

  return data?.id ?? null;
}

export async function recordInboundTransition(input: {
  inboundCallId: string;
  workspaceId: string | null;
  fromStatus: string | null;
  toStatus: string;
  reason: string;
  agentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from('inbound_call_transitions').insert({
    inbound_call_id: input.inboundCallId,
    workspace_id: input.workspaceId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    reason: input.reason,
    agent_id: input.agentId ?? null,
    metadata: input.metadata ?? {},
  });

  await supabase
    .from('inbound_calls')
    .update({
      status: input.toStatus,
      updated_at: new Date().toISOString(),
      ...(input.toStatus === 'active' ? { answered_at: new Date().toISOString() } : {}),
      ...(input.toStatus === 'completed' || input.toStatus === 'missed' || input.toStatus === 'failed'
        ? { ended_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', input.inboundCallId);
}
