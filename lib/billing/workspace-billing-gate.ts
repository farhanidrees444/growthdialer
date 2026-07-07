import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { apiForbidden } from '@/lib/api/errors';

/** Billing states that block outbound calling and power dial. */
const BLOCKED_STATUSES = new Set(['past_due', 'canceled', 'unpaid']);

/**
 * Returns null when the user may place calls; otherwise a 403 response.
 * Free plans are always allowed regardless of plan_status.
 */
export async function assertUserCanPlaceCalls(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('plan, plan_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return apiForbidden('Could not verify billing status', 'FORBIDDEN');
  }

  const plan = (settings?.plan as string | null) ?? 'free';
  if (plan === 'free' || plan === 'starter') {
    return null;
  }

  const status = (settings?.plan_status ?? 'active').toLowerCase();
  if (BLOCKED_STATUSES.has(status)) {
    return apiForbidden(
      'Calling is paused — update billing in Settings to restore your account.',
      'BILLING_BLOCKED',
    );
  }

  return null;
}

/** @deprecated Use assertUserCanPlaceCalls — workspace billing removed. */
export async function assertWorkspaceCanPlaceCalls(
  supabase: SupabaseClient,
  userIdOrWorkspaceId: string,
): Promise<NextResponse | null> {
  return assertUserCanPlaceCalls(supabase, userIdOrWorkspaceId);
}
