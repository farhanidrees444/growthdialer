import type { SupabaseClient } from '@supabase/supabase-js';
import { PRESENCE_HEARTBEAT_FRESH_MS } from '@/lib/twilio/resolve-inbound-ring-targets';

export type AgentPhoneStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'offline';
export type AgentPresenceStatus = 'online' | 'away' | 'offline';

export interface AgentPresenceRow {
  user_id: string;
  workspace_id: string | null;
  phone_status: AgentPhoneStatus;
  presence_status: AgentPresenceStatus;
  device_state: string | null;
  tab_id: string | null;
  sip_username: string | null;
  credential_id: string | null;
  last_seen_at: string;
  last_heartbeat_at: string;
}

export async function upsertAgentPresence(
  supabase: SupabaseClient,
  params: {
    userId: string;
    workspaceId?: string | null;
    phoneStatus: AgentPhoneStatus;
    presenceStatus?: AgentPresenceStatus;
    deviceState?: string | null;
    tabId?: string | null;
    sipUsername?: string | null;
    credentialId?: string | null;
  },
): Promise<void> {
  const {
    userId,
    workspaceId,
    phoneStatus,
    presenceStatus = 'online',
    deviceState,
    tabId,
    sipUsername,
    credentialId,
  } = params;
  const now = new Date().toISOString();
  await supabase.from('voice_agent_presence').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId ?? null,
      phone_status: phoneStatus,
      presence_status: presenceStatus,
      device_state: deviceState ?? null,
      tab_id: tabId ?? null,
      sip_username: sipUsername ?? null,
      credential_id: credentialId ?? null,
      last_seen_at: now,
      last_heartbeat_at: now,
    },
    { onConflict: 'user_id' },
  );
}

/** True when the agent's browser WebRTC client reported ready within the heartbeat window. */
export async function isAgentVoiceReady(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('voice_agent_presence')
    .select('phone_status, presence_status, last_heartbeat_at, last_seen_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return false;

  const heartbeatAt = (data.last_heartbeat_at as string | undefined) ?? (data.last_seen_at as string);
  const age = Date.now() - new Date(heartbeatAt).getTime();
  return (
    age <= PRESENCE_HEARTBEAT_FRESH_MS
    && data.presence_status === 'online'
    && data.phone_status === 'ready'
  );
}
