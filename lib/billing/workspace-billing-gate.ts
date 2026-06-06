import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { apiForbidden } from '@/lib/api/errors';

/** Billing states that block outbound calling and power dial. */
const BLOCKED_STATUSES = new Set(['past_due', 'canceled', 'unpaid']);

export interface WorkspaceBillingRow {
  id: string;
  plan: string | null;
  billing_status: string | null;
}

/**
 * Returns null when the workspace may place calls; otherwise a 403 response.
 * Free/starter workspaces are always allowed regardless of billing_status.
 */
export async function assertWorkspaceCanPlaceCalls(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<NextResponse | null> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, plan, billing_status')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error || !workspace) {
    return apiForbidden('Workspace not found', 'NO_WORKSPACE');
  }

  const plan = workspace.plan ?? 'free';
  if (plan === 'free') {
    return null;
  }

  const status = (workspace.billing_status ?? 'active').toLowerCase();
  if (BLOCKED_STATUSES.has(status)) {
    return apiForbidden(
      'Calling is paused — update billing in Settings to restore your workspace.',
      'BILLING_BLOCKED',
    );
  }

  return null;
}
