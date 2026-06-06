import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
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

    const url = new URL(request.url);
    const period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
    const days = period === 'month' ? 30 : 7;
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)),
    );

    let callsQuery = supabase
      .from('calls')
      .select('created_at, answered_at, status')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    callsQuery = teamView
      ? callsQuery.eq('workspace_id', wsId)
      : callsQuery.or(ownCallsOrFilter(wsId, userId));

    const { data: calls, error } = await callsQuery;

    if (error) {
      console.error('Activity stats query failed:', error);
      return NextResponse.json({ error: 'Unable to load activity data' }, { status: 500 });
    }

    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const label =
        period === 'week'
          ? date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
          : `D${index + 1}`;
      return { date: formatDate(date), day: label, calls: 0, connected: 0, meetings: 0 };
    });

    (calls ?? []).forEach((call) => {
      const dateStr = call.created_at ? new Date(call.created_at).toISOString().slice(0, 10) : null;
      if (!dateStr) return;
      const bucket = buckets.find((b) => b.date === dateStr);
      if (!bucket) return;

      bucket.calls += 1;
      if (call.answered_at) {
        bucket.connected += 1;
      }
    });

    return NextResponse.json({ period, data: buckets });
  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json({ error: 'Unable to load activity data' }, { status: 500 });
  }
}
