import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_DISPOSITIONS, type WorkspaceDispositionDef } from './defaults';

export type WorkspaceDisposition = WorkspaceDispositionDef & {
  id?: string;
  workspace_id?: string;
  is_active?: boolean;
};

export async function getWorkspaceDispositions(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceDisposition[]> {
  const { data } = await supabase
    .from('workspace_dispositions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (data?.length) {
    return data as WorkspaceDisposition[];
  }

  return DEFAULT_DISPOSITIONS;
}

export async function isValidWorkspaceDisposition(
  supabase: SupabaseClient,
  workspaceId: string,
  key: string,
): Promise<boolean> {
  const dispositions = await getWorkspaceDispositions(supabase, workspaceId);
  return dispositions.some((d) => d.key === key);
}

export function dispositionMeta(
  dispositions: WorkspaceDisposition[],
  key: string,
): WorkspaceDisposition | undefined {
  return dispositions.find((d) => d.key === key);
}
