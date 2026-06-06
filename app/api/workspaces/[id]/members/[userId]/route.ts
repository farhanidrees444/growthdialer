import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAssignRole, hasPermission, type Role } from '@/lib/auth/permissions';

type RouteCtx = { params: Promise<{ id: string; userId: string }> };

async function getCallerRole(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string) {
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  return data?.role as Role | undefined;
}

// PATCH /api/workspaces/[id]/members/[userId] — change role or status
export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const { id, userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerRole = await getCallerRole(supabase, id, user.id);
  if (!callerRole || !hasPermission(callerRole, 'CHANGE_ROLES')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cannot change own role or owner's role (unless you're the owner reassigning)
  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
  }

  const body = await request.json() as { role?: Role; status?: string };

  if (body.role && !canAssignRole(callerRole, body.role)) {
    return NextResponse.json({ error: 'You cannot assign that role' }, { status: 403 });
  }

  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', userId)
    .single();

  if (targetMember?.role === 'owner' && callerRole !== 'owner') {
    return NextResponse.json({ error: 'Cannot change the workspace owner role' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (body.role) patch.role = body.role;
  if (body.status) patch.status = body.status;

  const { error } = await supabase
    .from('workspace_members')
    .update(patch)
    .eq('workspace_id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/workspaces/[id]/members/[userId] — remove member
export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const { id, userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerRole = await getCallerRole(supabase, id, user.id);
  // Allow self-removal (leaving workspace) or admin/owner removal
  const isSelf = userId === user.id;
  if (!callerRole || (!isSelf && !hasPermission(callerRole, 'REMOVE_MEMBERS'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cannot remove the workspace owner
  const { data: ws } = await supabase.from('workspaces').select('owner_id').eq('id', id).single();
  if (ws?.owner_id === userId) {
    return NextResponse.json({ error: 'Cannot remove the workspace owner' }, { status: 400 });
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
