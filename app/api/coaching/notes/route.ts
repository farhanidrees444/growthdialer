import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const callId = request.nextUrl.searchParams.get('call_id');
  const agentId = request.nextUrl.searchParams.get('agent_id');
  let query = supabase
    .from('coaching_notes')
    .select('id, call_id, agent_id, coach_id, note, visible_to_agent, created_at, updated_at')
    .eq('workspace_id', access.workspaceId)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (callId) query = query.eq('call_id', callId);
  if (agentId) query = query.eq('agent_id', agentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    call_id?: string;
    note?: string;
    visible_to_agent?: boolean;
    workspace_id?: string;
  };
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, {
    permission: 'COACH_CALLS',
    body,
  });
  if (isWorkspaceError(access)) return access;

  const callId = body.call_id?.trim();
  const note = body.note?.trim();
  if (!callId || !note) return NextResponse.json({ error: 'call_id and note required' }, { status: 400 });

  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, workspace_id')
    .eq('id', callId)
    .eq('workspace_id', access.workspaceId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('coaching_notes')
    .upsert({
      call_id: call.id,
      workspace_id: access.workspaceId,
      agent_id: call.user_id,
      coach_id: user.id,
      note,
      visible_to_agent: body.visible_to_agent ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'call_id,coach_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, note: data });
}
