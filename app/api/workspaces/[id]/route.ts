import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/permissions';

async function getCallerRole(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string) {
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  return data?.role as string | undefined;
}

// PATCH /api/workspaces/[id] — update workspace name/settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getCallerRole(supabase, id, user.id);
  if (!role || !hasPermission(role, 'WORKSPACE_EDIT')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as { name?: string; settings?: Record<string, unknown> };
  const patch: Record<string, unknown> = {};
  if (body.name?.trim()) patch.name = body.name.trim();
  if (body.settings) patch.settings = body.settings;

  const { data, error } = await supabase
    .from('workspaces')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspace: data });
}

// DELETE /api/workspaces/[id] — owner only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getCallerRole(supabase, id, user.id);
  if (!role || !hasPermission(role, 'WORKSPACE_DELETE')) {
    return NextResponse.json({ error: 'Only the owner can delete a workspace' }, { status: 403 });
  }

  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
