import type { SupabaseClient } from '@supabase/supabase-js';
const PRESENCE_HEARTBEAT_FRESH_MS = 45_000;

export type AgentPhoneStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'offline';
export type AgentPresenceStatus = 'online' | 'away' | 'offline';

/** True when the agent's browser voice client reported ready within the heartbeat window. */
export async function isAgentVoiceReady(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('agent_presence')
    .select('status, device_state, last_heartbeat_at, updated_at')
    .eq('agent_id', userId)
    .maybeSingle();

  if (!data) return false;

  const heartbeatAt = (data.last_heartbeat_at as string | undefined)
    ?? (data.updated_at as string);
  const age = Date.now() - new Date(heartbeatAt).getTime();
  return (
    age <= PRESENCE_HEARTBEAT_FRESH_MS
    && data.status !== 'offline'
    && data.device_state === 'registered'
  );
}
