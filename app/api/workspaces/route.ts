import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const PLAN_LIMITS: Record<string, { plan: string; max_seats: number }> = {
  free: { plan: 'free', max_seats: 1 },
  pro: { plan: 'pro', max_seats: 3 },
  team: { plan: 'team', max_seats: 10 },
};

function slugFromName(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'workspace'}-${Math.random().toString(36).slice(2, 6)}`;
}

// GET /api/workspaces — list workspaces the current user belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, status, id, joined_at')
    .eq('user_id', user.id)
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

// POST /api/workspaces — create a new workspace (service role bootstrap when available)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { name: string; slug?: string; plan?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
  }

  const limits = PLAN_LIMITS[body.plan ?? 'free'] ?? PLAN_LIMITS.free;
  const slug = body.slug?.trim() || slugFromName(body.name.trim());
  const name = body.name.trim();

  const service = createServiceClient();
  const db = service ?? supabase;

  const { data: ws, error: wsErr } = await db
    .from('workspaces')
    .insert({
      name,
      slug,
      owner_id: user.id,
      plan: limits.plan,
      max_seats: limits.max_seats,
    })
    .select()
    .single();

  if (wsErr || !ws) {
    if (wsErr?.code === '23505') {
      return NextResponse.json({ error: 'That workspace URL is already taken — try a different name' }, { status: 409 });
    }
    console.error('[workspaces] insert failed:', wsErr);
    return NextResponse.json({ error: wsErr?.message ?? 'Could not create workspace' }, { status: 500 });
  }

  const { error: memberErr } = await db.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  });

  if (memberErr) {
    console.error('[workspaces] member insert failed:', memberErr);
    await db.from('workspaces').delete().eq('id', ws.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({ workspace: { ...ws, role: 'owner' } }, { status: 201 });
}
