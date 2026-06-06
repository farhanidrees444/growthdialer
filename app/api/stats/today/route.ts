import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

function applyCallScope<T extends { or: (f: string) => T; eq: (c: string, v: string) => T }>(
  query: T,
  workspaceId: string,
  userId: string,
  teamView: boolean,
): T {
  if (teamView) return query.eq('workspace_id', workspaceId);
  return query.or(ownCallsOrFilter(workspaceId, userId));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    const teamView = canViewTeamCalls(access);
    const wsId = access.workspaceId;

    const now = new Date();
    const todayStart = startOfDayUTC(now);
    const tomorrowStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    ).toISOString();
    const yesterdayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
    ).toISOString();

    const [
      { count: callsToday },
      { count: answeredToday },
      { count: callsYesterday },
      { count: answeredYesterday },
      { count: leadsCount },
      { count: meetingsBooked },
    ] = await Promise.all([
      applyCallScope(
        supabase.from('calls').select('id', { count: 'exact', head: true }),
        wsId,
        userId,
        teamView,
      )
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart),
      applyCallScope(
        supabase.from('calls').select('id', { count: 'exact', head: true }),
        wsId,
        userId,
        teamView,
      )
        .not('answered_at', 'is', null)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart),
      applyCallScope(
        supabase.from('calls').select('id', { count: 'exact', head: true }),
        wsId,
        userId,
        teamView,
      )
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart),
      applyCallScope(
        supabase.from('calls').select('id', { count: 'exact', head: true }),
        wsId,
        userId,
        teamView,
      )
        .not('answered_at', 'is', null)
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', wsId)
        .is('deleted_at', null),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', wsId)
        .eq('status', 'meeting_booked'),
    ]);

    const total = callsToday ?? 0;
    const answered = answeredToday ?? 0;
    const connectRate = total ? Math.round((answered / total) * 10000) / 100 : 0;

    let pipelineValue = 0;
    try {
      let dealQuery = applyCallScope(
        supabase.from('calls').select('deal_value_usd'),
        wsId,
        userId,
        teamView,
      )
        .in('disposition', ['interested', 'meeting_booked', 'callback'])
        .not('deal_value_usd', 'is', null);

      const { data: dealData } = await dealQuery;
      if (dealData) {
        pipelineValue = dealData.reduce((sum, r) => sum + (Number((r as { deal_value_usd: number | null }).deal_value_usd) || 0), 0);
      }
    } catch {
      pipelineValue = 0;
    }

    const totalYesterday = callsYesterday ?? 0;
    const answeredYesterdayCount = answeredYesterday ?? 0;
    const yesterdayRate = totalYesterday
      ? Math.round((answeredYesterdayCount / totalYesterday) * 10000) / 100
      : 0;

    return NextResponse.json({
      callsToday: total,
      connectRate,
      meetingsBooked: meetingsBooked ?? 0,
      pipelineValue,
      leadsCount: leadsCount ?? 0,
      yesterday: {
        calls: totalYesterday,
        connectRate: yesterdayRate,
      },
    });
  } catch (error) {
    console.error('Stats today error:', error);
    return NextResponse.json({ error: 'Unable to load stats' }, { status: 500 });
  }
}
