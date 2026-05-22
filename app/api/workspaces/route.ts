import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/workspaces — list workspaces the current user belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, status, id, joined_at')
    .eq('user_id', session.user.id)
    .eq('status', 'active');

  if (!members?.length) return NextResponse.json({ workspaces: [] });

  const wsIds = members.map((m) => m.workspace_id);
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .in('id', wsIds)
    .order('created_at', { ascending: true });

  const withRole = (workspaces ?? []).map((ws) => ({
    ...ws,
    role: members.find((m) => m.workspace_id === ws.id)?.role ?? 'agent',
    member_id: members.find((m) => m.workspace_id === ws.id)?.id,
  }));

  return NextResponse.json({ workspaces: withRole });
}

// POST /api/workspaces — create a new workspace
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { name: string; slug?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
  }

  const slug = body.slug?.trim()
    || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6);

  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: body.name.trim(), slug, owner_id: session.user.id })
    .select()
    .single();

  if (wsErr) {
    if (wsErr.code === '23505') {
      return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: wsErr.message }, { status: 500 });
  }

  await supabase.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: session.user.id,
    role: 'owner',
    status: 'active',
  });

  return NextResponse.json({ workspace: ws }, { status: 201 });
}
