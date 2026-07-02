import type { SupabaseClient } from '@supabase/supabase-js';

export type AgentReachabilityStatus = 'online' | 'away' | 'offline';
export type AgentPhoneStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'offline';

export interface AgentPresenceHeartbeat {
  agentId: string;
  workspaceId?: string | null;
  status: AgentReachabilityStatus;
  phoneStatus: AgentPhoneStatus;
  deviceState?: string | null;
  tabId?: string | null;
}

export async function upsertCleanAgentPresence(
  supabase: SupabaseClient,
  heartbeat: AgentPresenceHeartbeat,
): Promise<void> {
  const now = new Date().toISOString();
  const reachability =
    heartbeat.phoneStatus === 'ready' && heartbeat.status !== 'offline'
      ? 'online'
      : heartbeat.status;

  const deviceState =
    heartbeat.phoneStatus === 'ready'
      ? (heartbeat.deviceState ?? 'registered')
      : (heartbeat.deviceState ?? null);

  const { error } = await supabase.from('agent_presence').upsert(
    {
      agent_id: heartbeat.agentId,
      status: reachability,
      last_heartbeat_at: now,
      device_state: deviceState,
      updated_at: now,
    },
    { onConflict: 'agent_id' },
  );

  if (error) throw error;
}

