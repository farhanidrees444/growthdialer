import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';
import {
  effectiveCallEndTime,
  isEligibleRecentCall,
  type DashboardRecentCall,
} from '@/lib/calls/recent';

const FETCH_LIMIT = 25;
const RETURN_LIMIT = 5;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = user.id;
  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const teamView = canViewTeamCalls(access);

  let query = supabase
    .from('calls')
    .select(`
      id, direction, from_number, to_number, duration_seconds,
      ended_at, disposition, lead_id, recording_url,
      answered_at, status, started_at, created_at, updated_at,
      leads:lead_id (name, company)
    `)
    .order('created_at', { ascending: false })
    .limit(FETCH_LIMIT);

  query = teamView
    ? query.eq('user_id', userId)
    : query.or(ownCallsOrFilter(null, user.id));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type LeadJoin = { name: string | null; company: string | null } | null;

  const calls: DashboardRecentCall[] = (data ?? [])
    .filter((row) =>
      isEligibleRecentCall({
        ended_at: row.ended_at as string | null,
        disposition: row.disposition as string | null,
        answered_at: row.answered_at as string | null,
        status: row.status as string | null,
        duration_seconds: row.duration_seconds as number | null,
      }),
    )
    .map((row) => {
      const rawLead = row.leads as LeadJoin | LeadJoin[] | null;
      const lead = Array.isArray(rawLead) ? (rawLead[0] ?? null) : rawLead;
      return {
        id: row.id as string,
        direction: row.direction as DashboardRecentCall['direction'],
        from_number: row.from_number as string | null,
        to_number: row.to_number as string | null,
        duration_seconds: row.duration_seconds as number | null,
        ended_at: row.ended_at as string | null,
        disposition: row.disposition as string | null,
        lead_id: row.lead_id as string | null,
        recording_url: row.recording_url as string | null,
        display_at: effectiveCallEndTime({
          ended_at: row.ended_at as string | null,
          updated_at: row.updated_at as string | null,
          started_at: row.started_at as string | null,
          created_at: row.created_at as string,
        }),
        leads: lead,
      };
    })
    .sort((a, b) => new Date(b.display_at).getTime() - new Date(a.display_at).getTime())
    .slice(0, RETURN_LIMIT);

  return NextResponse.json({ calls });
}
