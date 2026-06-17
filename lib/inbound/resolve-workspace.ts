import type { SupabaseClient } from '@supabase/supabase-js';

export async function resolveUserWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.workspace_id as string | undefined) ?? null;
}
