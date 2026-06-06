import type { SupabaseClient } from '@supabase/supabase-js';

/** After a call disposition, advance active sequence enrollment to next step. */
export async function advanceSequenceAfterCall(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
): Promise<void> {
  const { data: enrollment } = await supabase
    .from('sequence_enrollments')
    .select('id, sequence_id, current_step_index')
    .eq('workspace_id', workspaceId)
    .eq('lead_id', leadId)
    .eq('status', 'active')
    .maybeSingle();

  if (!enrollment) return;

  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('step_type, wait_days, step_order')
    .eq('sequence_id', enrollment.sequence_id)
    .order('step_order', { ascending: true });

  if (!steps?.length) return;

  const current = steps[enrollment.current_step_index];
  if (!current || current.step_type !== 'call') return;

  const nextIndex = enrollment.current_step_index + 1;
  const nextStep = steps[nextIndex];
  const now = new Date();

  if (!nextStep) {
    await supabase
      .from('sequence_enrollments')
      .update({ status: 'completed', updated_at: now.toISOString() })
      .eq('id', enrollment.id);
    return;
  }

  const waitMs = nextStep.step_type === 'wait' ? nextStep.wait_days * 86400000 : 0;
  const nextActionAt = new Date(now.getTime() + waitMs).toISOString();

  await supabase
    .from('sequence_enrollments')
    .update({
      current_step_index: nextIndex,
      next_action_at: nextActionAt,
      updated_at: now.toISOString(),
    })
    .eq('id', enrollment.id);
}
