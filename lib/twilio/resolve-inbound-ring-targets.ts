import type { SupabaseClient } from '@supabase/supabase-js';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';

/** Heartbeat must be fresher than this to count as ringable. */
export const PRESENCE_HEARTBEAT_FRESH_MS = 45_000;

export interface InboundRingTarget {
  userId: string;
  clientIdentity: string;
}

interface PresenceRow {
  agent_id: string;
  status: string;
  device_state: string | null;
  last_heartbeat_at: string;
  updated_at: string;
}

function isAgentRingable(row: PresenceRow, nowMs: number): boolean {
  const heartbeatAt = row.last_heartbeat_at ?? row.updated_at;
  const age = nowMs - new Date(heartbeatAt).getTime();
  if (age > PRESENCE_HEARTBEAT_FRESH_MS) return false;
  if (row.status === 'offline') return false;
  return row.device_state === 'registered';
}

async function readPresenceRows(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<PresenceRow[]> {
  const { data, error } = await supabase
    .from('agent_presence')
    .select('agent_id, status, device_state, last_heartbeat_at, updated_at')
    .in('agent_id', userIds);

  if (error) {
    console.warn('[TwilioVoice] agent_presence read failed:', error.message);
    return [];
  }

  return (data ?? []) as PresenceRow[];
}

/**
 * Resolve ordered Twilio Client identities for inbound ring-group routing.
 * Primary owner first when online; then other online workspace agents.
 */
export async function resolveInboundRingTargets(
  supabase: SupabaseClient,
  params: {
    primaryUserId: string;
    workspaceId: string | null;
  },
): Promise<InboundRingTarget[]> {
  const { primaryUserId, workspaceId } = params;
  const nowMs = Date.now();

  let candidateUserIds: string[] = [primaryUserId];

  if (workspaceId) {
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    const memberIds = (members ?? []).map((m) => m.user_id as string);
    candidateUserIds = [...new Set([primaryUserId, ...memberIds])];
  }

  const presenceRows = await readPresenceRows(supabase, candidateUserIds);

  const online = new Set<string>();
  for (const row of presenceRows) {
    if (isAgentRingable(row, nowMs)) {
      online.add(row.agent_id);
    }
  }

  const ordered: InboundRingTarget[] = [];
  if (online.has(primaryUserId)) {
    ordered.push({
      userId: primaryUserId,
      clientIdentity: toTwilioClientIdentity(primaryUserId),
    });
  }

  for (const uid of candidateUserIds) {
    if (uid === primaryUserId || !online.has(uid)) continue;
    ordered.push({
      userId: uid,
      clientIdentity: toTwilioClientIdentity(uid),
    });
  }

  return ordered;
}
