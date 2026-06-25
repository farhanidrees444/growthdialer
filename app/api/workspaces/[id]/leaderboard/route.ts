import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasPermission, type Role } from '@/lib/auth/permissions';

const POINTS = {
  connect: 10,
  meeting: 50,
  interested: 25,
  callback: 5,
} as const;

type Metric = 'points' | 'calls' | 'talk_time' | 'deals' | 'ai_score';

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

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') ?? '7', 10)));
  const metric = (url.searchParams.get('metric') ?? 'points') as Metric;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', id)
    .eq('status', 'active');

  const userIds = (members ?? []).map((m) => m.user_id);
  if (!userIds.length) {
    return NextResponse.json({ days, member_count: 0, solo: true, rankings: [] });
  }

  const { data: calls } = await supabase
    .from('calls')
    .select('id, user_id, answered_at, disposition, duration_seconds')
    .eq('workspace_id', id)
    .in('user_id', userIds)
    .gte('started_at', since);

  const callIds = (calls ?? []).map((call) => call.id);
  const [{ data: scores }, { data: badges }] = await Promise.all([
    callIds.length
      ? supabase.from('call_scores').select('call_id, agent_id, total_score').eq('workspace_id', id).in('call_id', callIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('leaderboard_badges')
      .select('agent_id, badge_label')
      .eq('workspace_id', id)
      .gte('week_start', since.slice(0, 10)),
  ]);

  const scoresByAgent = new Map<string, number[]>();
  for (const score of scores ?? []) {
    scoresByAgent.set(score.agent_id, [...(scoresByAgent.get(score.agent_id) ?? []), Number(score.total_score ?? 0)]);
  }

  const badgesByAgent = new Map<string, string[]>();
  for (const badge of badges ?? []) {
    badgesByAgent.set(badge.agent_id, [...(badgesByAgent.get(badge.agent_id) ?? []), badge.badge_label]);
  }

  const profileMap = new Map<string, { email: string; full_name: string }>();
  const svc = createServiceClient();
  if (svc) {
    const { data: usersResp } = await svc.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersResp?.users ?? []) {
      if (userIds.includes(u.id)) {
        profileMap.set(u.id, {
          email: u.email ?? '',
          full_name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'Agent',
        });
      }
    }
  }

  type RankRow = {
    user_id: string;
    full_name: string | null;
    role: string;
    calls: number;
    connects: number;
    meetings: number;
    connect_rate: number;
    points: number;
    talk_time_seconds: number;
    coaching_score: number;
    badges: string[];
    rank: number;
  };

  const byUser = new Map<string, RankRow>();
  for (const m of members ?? []) {
    const p = profileMap.get(m.user_id);
    byUser.set(m.user_id, {
      user_id: m.user_id,
      full_name: p?.full_name ?? null,
      role: m.role,
      calls: 0,
      connects: 0,
      meetings: 0,
      connect_rate: 0,
      points: 0,
      talk_time_seconds: 0,
      coaching_score: 0,
      badges: badgesByAgent.get(m.user_id) ?? [],
      rank: 0,
    });
  }

  for (const call of calls ?? []) {
    const row = byUser.get(call.user_id);
    if (!row) continue;
    row.calls += 1;
    row.talk_time_seconds += call.duration_seconds ?? 0;
    if (call.answered_at) {
      row.connects += 1;
      row.points += POINTS.connect;
      row.points += Math.min(20, Math.floor((call.duration_seconds ?? 0) / 60));
    }
    if (call.disposition === 'meeting_booked') {
      row.meetings += 1;
      row.points += POINTS.meeting;
    }
    if (call.disposition === 'interested') row.points += POINTS.interested;
    if (call.disposition === 'callback') row.points += POINTS.callback;
  }

  const rankings = Array.from(byUser.values())
    .map((a) => ({
      ...a,
      connect_rate: a.calls > 0 ? Math.round((a.connects / a.calls) * 1000) / 10 : 0,
      coaching_score: Math.round(
        (scoresByAgent.get(a.user_id) ?? []).reduce((sum, score) => sum + score, 0)
        / Math.max(1, (scoresByAgent.get(a.user_id) ?? []).length),
      ),
    }))
    .sort((a, b) => {
      if (metric === 'calls') return b.calls - a.calls || b.points - a.points;
      if (metric === 'talk_time') return b.talk_time_seconds - a.talk_time_seconds || b.points - a.points;
      if (metric === 'deals') return b.meetings - a.meetings || b.points - a.points;
      if (metric === 'ai_score') return b.coaching_score - a.coaching_score || b.points - a.points;
      return b.points - a.points || b.connects - a.connects;
    })
    .map((a, i) => ({ ...a, rank: i + 1 }));

  const memberCount = members?.length ?? 0;

  return NextResponse.json({
    days,
    metric,
    member_count: memberCount,
    solo: memberCount <= 1,
    rankings,
  });
}
