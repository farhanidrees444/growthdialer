import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasPermission, type Role } from '@/lib/auth/permissions';

interface AgentMetric {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  calls: number;
  connects: number;
  meetings: number;
  talk_time_seconds: number;
  connect_rate: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!caller || !hasPermission(caller.role as Role, 'VIEW_TEAM_ANALYTICS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const days = Math.min(90, Math.max(1, parseInt(new URL(request.url).searchParams.get('days') ?? '7', 10)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', id)
    .eq('status', 'active');

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) {
    return NextResponse.json({ days, agents: [], totals: { calls: 0, connects: 0, meetings: 0 } });
  }

  const { data: calls } = await supabase
    .from('calls')
    .select('user_id, answered_at, duration_seconds, disposition')
    .eq('workspace_id', id)
    .in('user_id', userIds)
    .gte('started_at', since);

  const profileMap = new Map<string, { email: string; full_name: string }>();
  const svc = createServiceClient();
  if (svc) {
    const { data: usersResp } = await svc.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersResp?.users ?? []) {
      if (userIds.includes(u.id)) {
        profileMap.set(u.id, {
          email: u.email ?? '',
          full_name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'Unknown',
        });
      }
    }
  }

  const byUser = new Map<string, AgentMetric>();
  for (const m of members ?? []) {
    const profile = profileMap.get(m.user_id);
    byUser.set(m.user_id, {
      user_id: m.user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      role: m.role,
      calls: 0,
      connects: 0,
      meetings: 0,
      talk_time_seconds: 0,
      connect_rate: 0,
    });
  }

  for (const call of calls ?? []) {
    const row = byUser.get(call.user_id);
    if (!row) continue;
    row.calls += 1;
    if (call.answered_at) {
      row.connects += 1;
      row.talk_time_seconds += call.duration_seconds ?? 0;
    }
    if (call.disposition === 'meeting_booked') row.meetings += 1;
  }

  const agents = Array.from(byUser.values())
    .map((a) => ({
      ...a,
      connect_rate: a.calls > 0 ? Math.round((a.connects / a.calls) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.calls - a.calls || b.connects - a.connects);

  const totals = agents.reduce(
    (acc, a) => ({
      calls: acc.calls + a.calls,
      connects: acc.connects + a.connects,
      meetings: acc.meetings + a.meetings,
    }),
    { calls: 0, connects: 0, meetings: 0 },
  );

  return NextResponse.json({ days, agents, totals });
}
