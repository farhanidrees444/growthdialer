import type { SupabaseClient } from '@supabase/supabase-js';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';

/** Heartbeat must be fresher than this to count as ringable. */
export const PRESENCE_HEARTBEAT_FRESH_MS = 45_000;

export interface InboundRingTarget {
  userId: string;
  clientIdentity: string;
}

interface PresenceRow {
  user_id: string;
  phone_status: string;
  presence_status: string;
  device_state: string | null;
  last_heartbeat_at: string;
  last_seen_at: string;
}

function isAgentRingable(row: PresenceRow, nowMs: number): boolean {
  const heartbeatAt = row.last_heartbeat_at ?? row.last_seen_at;
  const age = nowMs - new Date(heartbeatAt).getTime();
  if (age > PRESENCE_HEARTBEAT_FRESH_MS) return false;
  if (row.presence_status === 'offline') return false;
  return row.phone_status === 'ready' && row.device_state === 'registered';
}

async function readPresenceRows(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<PresenceRow[]> {
  const { data: cleanRows, error: cleanError } = await supabase
    .from('agent_presence')
    .select('agent_id, status, device_state, last_heartbeat_at, updated_at')
    .in('agent_id', userIds);

  if (!cleanError && cleanRows) {
    return cleanRows.map((row) => ({
      user_id: row.agent_id as string,
      // `agent_presence` only exists for registered browser devices, so
      // readiness is derived from status + device_state.
      phone_status: row.device_state === 'registered' ? 'ready' : 'offline',
      presence_status: row.status as string,
      device_state: (row.device_state as string | null) ?? null,
      last_heartbeat_at: row.last_heartbeat_at as string,
      last_seen_at: row.updated_at as string,
    }));
  }

  if (cleanError?.code !== '42P01') {
    console.warn('[TwilioVoice] agent_presence read failed; falling back:', cleanError?.message);
  }

  const { data: legacyRows, error: legacyError } = await supabase
    .from('voice_agent_presence')
    .select('user_id, phone_status, presence_status, device_state, last_heartbeat_at, last_seen_at')
    .in('user_id', userIds);

  if (legacyError) {
    console.warn('[TwilioVoice] voice_agent_presence read failed:', legacyError.message);
    return [];
  }

  return (legacyRows ?? []) as PresenceRow[];
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
      online.add(row.user_id);
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
