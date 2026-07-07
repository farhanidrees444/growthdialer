import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { apiUnauthorized } from '@/lib/api/errors';
import { z } from 'zod';

const enrollSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(500),
  workspace_id: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sequenceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const raw = await request.json();
  const { lead_ids } = enrollSchema.parse(raw);
  const userId = user.id;
  const access = await requireWorkspaceFromRequest(request, supabase, userId, { body: raw });
  if (isWorkspaceError(access)) return access;

  const { data: seq } = await supabase
    .from('sequences')
    .select('id, status')
    .eq('id', sequenceId)
    .eq('user_id', userId)
    .single();

  if (!seq || seq.status !== 'active') {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const rows = lead_ids.map((lead_id) => ({
    sequence_id: sequenceId,
    lead_id,
    current_step_index: 0,
    status: 'active' as const,
    next_action_at: now,
    enrolled_by: user.id,
  }));

  const { data, error } = await supabase
    .from('sequence_enrollments')
    .upsert(rows, { onConflict: 'sequence_id,lead_id', ignoreDuplicates: false })
    .select('id, lead_id');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ enrolled: data?.length ?? 0 });
}
