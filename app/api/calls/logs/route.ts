import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import type { CallLogRow } from '@/lib/calls/display';
import { isMissedCall, isConnected } from '@/lib/calls/display';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'VIEW_OWN_RECORDINGS') && !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction') ?? 'all';
  const filter = searchParams.get('filter') ?? 'all';
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);

  const teamView = canViewTeamCalls(access);
  const wsId = access.workspaceId;

  let query = supabase
    .from('calls')
    .select(`
      id, direction, status, disposition, from_number, to_number,
      duration_seconds, started_at, created_at, answered_at, ended_at,
      recording_url, was_recorded, lead_id,
      leads:lead_id (id, name, company, phone)
    `, { count: 'exact' })
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  query = teamView
    ? query.eq('workspace_id', wsId)
    : query.or(ownCallsOrFilter(wsId, user.id));

  if (direction === 'inbound' || direction === 'outbound') {
    query = query.eq('direction', direction);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type LeadJoin = CallLogRow['leads'];
  let calls: CallLogRow[] = (data ?? []).map((row) => {
    const rawLead = row.leads as LeadJoin | LeadJoin[] | null;
    const lead = Array.isArray(rawLead) ? (rawLead[0] ?? null) : rawLead;
    return { ...row, leads: lead } as CallLogRow;
  });

  if (filter === 'missed') {
    calls = calls.filter(isMissedCall);
  } else if (filter === 'connected') {
    calls = calls.filter(isConnected);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let statsQuery = supabase
    .from('calls')
    .select('direction, status, disposition, answered_at, duration_seconds, started_at, created_at');

  statsQuery = teamView
    ? statsQuery.eq('workspace_id', wsId)
    : statsQuery.or(ownCallsOrFilter(wsId, user.id));

  const { data: statsRows } = await statsQuery.limit(500);

  const todayCalls = (statsRows ?? []).filter((c) => {
    const t = c.started_at ?? c.created_at;
    return t && new Date(t) >= todayStart;
  });

  const inboundToday = todayCalls.filter((c) => c.direction === 'inbound').length;
  const outboundToday = todayCalls.filter((c) => c.direction === 'outbound').length;
  const missedToday = todayCalls.filter((c) =>
    isMissedCall(c as CallLogRow),
  ).length;
  const connectedToday = todayCalls.filter((c) =>
    isConnected(c as CallLogRow),
  ).length;
  const connectRate = todayCalls.length > 0
    ? Math.round((connectedToday / todayCalls.length) * 100)
    : 0;

  return NextResponse.json({
    calls,
    total: count ?? calls.length,
    stats: {
      todayTotal: todayCalls.length,
      inboundToday,
      outboundToday,
      missedToday,
      connectedToday,
      connectRate,
    },
  });
}
