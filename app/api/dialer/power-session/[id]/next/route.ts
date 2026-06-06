import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      excludeLeadId?: string;
      calledLeadIds?: string[];
      current_disposition?: string;
      workspace_id?: string;
    };
    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const userId = user.id;
    const { excludeLeadId, calledLeadIds = [] } = body;

    // Verify session belongs to user and is active
    const { data: powerSession } = await supabase
      .from('power_dial_sessions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!powerSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (powerSession.status !== 'active') return NextResponse.json({ nextLead: null, done: true });

    // Build exclusion list: current lead + all leads called in this session
    const excluded = [...calledLeadIds];
    if (excludeLeadId && !excluded.includes(excludeLeadId)) excluded.push(excludeLeadId);

    let query = supabase
      .from('leads')
      .select('id, name, title, company, phone, email, status, ai_score, last_called_at, call_attempts, tags, notes, dnc')
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null)
      .not('status', 'in', '("do_not_call","meeting_booked")')
      .eq('dnc', false)
      .order('ai_score', { ascending: false })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (excluded.length > 0) {
      query = query.not('id', 'in', `(${excluded.map((id) => `"${id}"`).join(',')})`);
    }

    const { data: leads } = await query;
    const nextLead = leads?.[0] ?? null;

    if (!nextLead) {
      return NextResponse.json({ ended: true, reason: 'queue_empty', nextLead: null, done: true, queue_remaining: 0 });
    }

    // Count remaining leads after this one
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null)
      .not('status', 'in', '("do_not_call","meeting_booked")')
      .eq('dnc', false);

    const allExcluded = [...excluded, nextLead.id];
    if (allExcluded.length > 0) {
      countQuery = countQuery.not('id', 'in', `(${allExcluded.map((eid) => `"${eid}"`).join(',')})`);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      next_lead: nextLead,
      nextLead,
      queue_remaining: count ?? 0,
      done: false,
      ended: false,
    });
  } catch (err) {
    console.error('[power-session/next]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
