import type { SupabaseClient } from '@supabase/supabase-js';

const PRESENCE_STALE_MS = 90_000;

export type AgentPhoneStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'offline';

export interface AgentPresenceRow {
  user_id: string;
  workspace_id: string | null;
  phone_status: AgentPhoneStatus;
  sip_username: string | null;
  credential_id: string | null;
  last_seen_at: string;
}

export async function upsertAgentPresence(
  supabase: SupabaseClient,
  params: {
    userId: string;
    workspaceId?: string | null;
    phoneStatus: AgentPhoneStatus;
    sipUsername?: string | null;
    credentialId?: string | null;
  },
): Promise<void> {
  const { userId, workspaceId, phoneStatus, sipUsername, credentialId } = params;
  await supabase.from('voice_agent_presence').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId ?? null,
      phone_status: phoneStatus,
      sip_username: sipUsername ?? null,
      credential_id: credentialId ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

/** True when the agent's browser WebRTC client reported ready within the stale window. */
export async function isAgentVoiceReady(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('voice_agent_presence')
    .select('phone_status, last_seen_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return false;

  const age = Date.now() - new Date(data.last_seen_at as string).getTime();
  return age <= PRESENCE_STALE_MS && data.phone_status === 'ready';
}
