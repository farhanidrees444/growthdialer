import type { SupabaseClient } from '@supabase/supabase-js';
import { hasPermission, type Role } from '@/lib/auth/permissions';

/** Health probes expose vendor latency — limit to workspace owners/admins. */
export async function userCanViewOpsHealth(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!data?.length) return false;

  return data.some((row) =>
    hasPermission(row.role as Role, 'VIEW_BILLING')
    || hasPermission(row.role as Role, 'WORKSPACE_EDIT'),
  );
}
