import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { apiUnauthorized } from '@/lib/api/errors';
import { sequenceNameError } from '@/lib/sequences/cleanup';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  workspace_id: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const raw = await request.json();
  const parsed = patchSchema.parse(raw);
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body: raw });
  if (isWorkspaceError(access)) return access;

  if (parsed.name !== undefined) {
    const nameErr = sequenceNameError(parsed.name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
  }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (parsed.name !== undefined) updates.name = parsed.name.trim();
  if (parsed.status !== undefined) updates.status = parsed.status;

  const { data, error } = await supabase
    .from('sequences')
    .update(updates)
    .eq('id', id)
    .eq('workspace_id', access.workspaceId)
    .select('id, name, status')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  return NextResponse.json({ sequence: data });
}

/** Archives a sequence (soft delete). Enrollments stay for audit; list hides archived rows. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const { data, error } = await supabase
    .from('sequences')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', access.workspaceId)
    .neq('status', 'archived')
    .select('id, name')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  await supabase
    .from('sequence_enrollments')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('sequence_id', id)
    .eq('workspace_id', access.workspaceId)
    .eq('status', 'active');

  return NextResponse.json({ archived: true, sequence: data });
}
