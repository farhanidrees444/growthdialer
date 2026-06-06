import type { SupabaseClient } from '@supabase/supabase-js';

export async function countWorkspaceSeatsUsed(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<{ activeMembers: number; pendingInvites: number; totalUsed: number }> {
  const now = new Date().toISOString();

  const [{ count: activeMembers }, { count: pendingInvites }] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
    supabase
      .from('workspace_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', now),
  ]);

  const active = activeMembers ?? 0;
  const pending = pendingInvites ?? 0;
  return { activeMembers: active, pendingInvites: pending, totalUsed: active + pending };
}
