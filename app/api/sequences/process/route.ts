import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { apiUnauthorized } from '@/lib/api/errors';

/**
 * Advance wait steps on due enrollments. Call steps stay on current index until
 * rep dials and disposition advances via disposition route.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const userId = user.id;
  const now = new Date().toISOString();

  const { data: due } = await supabase
    .from('sequence_enrollments')
    .select('id, sequence_id, current_step_index')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('next_action_at', now)
    .limit(200);

  let advanced = 0;

  for (const enrollment of due ?? []) {
    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('step_type, wait_days, step_order')
      .eq('sequence_id', enrollment.sequence_id)
      .order('step_order', { ascending: true });

    if (!steps?.length) continue;

    let idx = enrollment.current_step_index;
    const step = steps[idx];
    if (!step) {
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'completed', updated_at: now })
        .eq('id', enrollment.id);
      advanced += 1;
      continue;
    }

    if (step.step_type === 'wait') {
      idx += 1;
      const next = steps[idx];
      const nextAt = next
        ? new Date(Date.now() + (next.step_type === 'wait' ? next.wait_days : 0) * 86400000).toISOString()
        : null;

      await supabase
        .from('sequence_enrollments')
        .update({
          current_step_index: idx,
          next_action_at: nextAt ?? now,
          status: next ? 'active' : 'completed',
          updated_at: now,
        })
        .eq('id', enrollment.id);
      advanced += 1;
    }
  }

  return NextResponse.json({ processed: advanced });
}
