import type { SupabaseClient } from '@supabase/supabase-js';

const RINGABLE_HEARTBEAT_MS = 45_000;

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

function isAgentRingable(row: {
  status: string;
  device_state: string | null;
  last_heartbeat_at: string;
}): boolean {
  const age = Date.now() - new Date(row.last_heartbeat_at).getTime();
  if (age > RINGABLE_HEARTBEAT_MS) return false;
  if (row.status === 'offline') return false;
  if (row.device_state === 'registered' || row.device_state === 'registering') return true;
  return row.status === 'online' || row.status === 'away';
}

export async function listRingableAgents(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - RINGABLE_HEARTBEAT_MS).toISOString();
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  const memberIds = (members ?? []).map((row) => row.user_id).filter(Boolean);
  if (!memberIds.length) return [];

  const { data: presence } = await supabase
    .from('agent_presence')
    .select('agent_id, status, device_state, last_heartbeat_at')
    .in('agent_id', memberIds)
    .neq('status', 'offline')
    .gte('last_heartbeat_at', cutoff)
    .order('last_heartbeat_at', { ascending: false });

  return (presence ?? [])
    .filter((row) => isAgentRingable(row))
    .map((row) => row.agent_id);
}
