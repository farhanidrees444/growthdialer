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

  // New clean inbound schema. This table may not exist until the founder runs
  // migration 057, so failure here must not stop the legacy-compatible write.
  const { error: cleanError } = await supabase.from('agent_presence').upsert(
    {
      agent_id: heartbeat.agentId,
      workspace_id: heartbeat.workspaceId ?? null,
      status: heartbeat.status,
      last_heartbeat_at: now,
      device_state: heartbeat.deviceState ?? null,
      tab_id: heartbeat.tabId ?? null,
      updated_at: now,
    },
    { onConflict: 'agent_id' },
  );

  if (cleanError && cleanError.code !== '42P01') {
    console.warn('[agent-presence] clean presence write failed:', cleanError.message);
  }

  // Backward-compatible table used by currently deployed Twilio routing.
  const { error: legacyError } = await supabase.from('voice_agent_presence').upsert(
    {
      user_id: heartbeat.agentId,
      workspace_id: heartbeat.workspaceId ?? null,
      phone_status: heartbeat.phoneStatus,
      presence_status: heartbeat.status,
      device_state: heartbeat.deviceState ?? null,
      tab_id: heartbeat.tabId ?? null,
      last_seen_at: now,
      last_heartbeat_at: now,
    },
    { onConflict: 'user_id' },
  );

  if (legacyError) {
    throw legacyError;
  }
}

