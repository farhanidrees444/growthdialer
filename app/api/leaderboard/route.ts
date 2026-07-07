import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const POINTS = {
  connect: 10,
  meeting: 50,
  interested: 25,
  callback: 5,
} as const;

type Metric = 'points' | 'calls' | 'talk_time' | 'deals' | 'ai_score';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') ?? '7', 10)));
  const metric = (url.searchParams.get('metric') ?? 'points') as Metric;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const userId = user.id;

  const { data: calls } = await supabase
    .from('calls')
    .select('id, user_id, answered_at, disposition, duration_seconds')
    .eq('user_id', userId)
    .gte('started_at', since);

  const callIds = (calls ?? []).map((call) => call.id);
  const { data: scores } = callIds.length
    ? await supabase.from('call_scores').select('call_id, agent_id, total_score').eq('agent_id', userId).in('call_id', callIds)
    : { data: [] };

  const scoresByAgent = new Map<string, number[]>();
  for (const score of scores ?? []) {
    scoresByAgent.set(score.agent_id, [...(scoresByAgent.get(score.agent_id) ?? []), Number(score.total_score ?? 0)]);
  }

  let fullName = user.email?.split('@')[0] ?? 'You';
  const svc = createServiceClient();
  if (svc) {
    const { data: u } = await svc.auth.admin.getUserById(userId);
    fullName = (u.user?.user_metadata?.full_name as string) ?? fullName;
  }

  const row = {
    user_id: userId,
    full_name: fullName,
    role: 'owner',
    calls: 0,
    connects: 0,
    meetings: 0,
    connect_rate: 0,
    points: 0,
    talk_time_seconds: 0,
    coaching_score: 0,
    badges: [] as string[],
    rank: 1,
  };

  for (const call of calls ?? []) {
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

  row.connect_rate = row.calls > 0 ? Math.round((row.connects / row.calls) * 1000) / 10 : 0;
  row.coaching_score = Math.round(
    (scoresByAgent.get(userId) ?? []).reduce((sum, score) => sum + score, 0)
    / Math.max(1, (scoresByAgent.get(userId) ?? []).length),
  );

  const rankings = [row];

  return NextResponse.json({
    days,
    metric,
    member_count: 1,
    solo: true,
    rankings,
  });
}
