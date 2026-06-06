import type { SupabaseClient } from '@supabase/supabase-js';

/** Telnyx / WebRTC live call statuses (not stale DB rows). */
export const LIVE_CALL_STATUSES = ['ringing', 'answered'] as const;

const STALE_INITIATED_MS = 10 * 60 * 1000;

/**
 * Close orphan call rows left at `initiated` when parallel legs hung up
 * without a Telnyx hangup webhook (or WebRTC path skipped end).
 */
export async function cleanupStaleInitiatedCalls(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_INITIATED_MS).toISOString();
  await supabase
    .from('calls')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      hangup_cause: 'stale_cleanup',
    })
    .eq('workspace_id', workspaceId)
    .eq('status', 'initiated')
    .is('ended_at', null)
    .lt('created_at', cutoff);
}

export async function fetchLiveWorkspaceCalls(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  await cleanupStaleInitiatedCalls(supabase, workspaceId);

  const { data: calls } = await supabase
    .from('calls')
    .select(`
      id,
      user_id,
      lead_id,
      from_number,
      to_number,
      telnyx_call_id,
      status,
      created_at,
      started_at,
      answered_at,
      workspace_id
    `)
    .eq('workspace_id', workspaceId)
    .in('status', [...LIVE_CALL_STATUSES])
    .is('ended_at', null)
    .order('answered_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  return calls ?? [];
}
