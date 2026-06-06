import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Use service client (or fall back gracefully)
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  // Get user from Authorization header (passed from client)
  const auth = req.headers.get('authorization');
  const token = auth?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const userId = user.id;

  const access = await requireWorkspaceFromRequest(req, supabase, userId);
  if (isWorkspaceError(access)) return access;

  const teamView = canViewTeamCalls(access);
  const wsId = access.workspaceId;

  const scopeCalls = <T extends { eq: (c: string, v: string) => T; or: (f: string) => T }>(q: T) =>
    teamView ? q.eq('workspace_id', wsId) : q.or(ownCallsOrFilter(wsId, userId));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Hourly sparkline data for today (last 24 points).
  // We try to read analytics_id (used to count AI-processed calls per hour),
  // but if migration 033 hasn't been run yet that column may not exist —
  // we retry without it and silently set ai counts to 0.
  let hourlyCalls: Array<{
    created_at: string;
    status: string | null;
    disposition: string | null;
    duration_seconds: number | null;
    analytics_id?: string | null;
    ai_processed?: boolean | null;
  }> | null = null;

  {
    const { data, error } = await scopeCalls(supabase
      .from('calls')
      .select('created_at, status, disposition, duration_seconds, analytics_id, ai_processed'))
      .gte('created_at', todayStart)
      .order('created_at', { ascending: true });

    if (error && /column .* does not exist/i.test(error.message)) {
      console.warn('[dashboard/metrics] analytics_id missing — retrying without it. Run migration 033.');
      const retry = await scopeCalls(supabase
        .from('calls')
        .select('created_at, status, disposition, duration_seconds, ai_processed'))
        .gte('created_at', todayStart)
        .order('created_at', { ascending: true });
      hourlyCalls = retry.data;
    } else {
      hourlyCalls = data;
    }
  }

  // Build hourly buckets
  const hourlyBuckets: Record<number, { calls: number; connected: number; meetings: number; ai: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyBuckets[h] = { calls: 0, connected: 0, meetings: 0, ai: 0 };
  }
  for (const c of hourlyCalls ?? []) {
    const h = new Date(c.created_at).getHours();
    if (!hourlyBuckets[h]) continue;
    hourlyBuckets[h].calls++;
    if (c.status === 'completed' && c.duration_seconds && c.duration_seconds > 5) {
      hourlyBuckets[h].connected++;
    }
    if (c.disposition === 'meeting_booked') hourlyBuckets[h].meetings++;
    if (c.analytics_id || c.ai_processed) hourlyBuckets[h].ai++;
  }

  const sparklineData = Object.entries(hourlyBuckets).map(([h, v]) => ({
    hour: parseInt(h),
    label: `${h.padStart(2, '0')}:00`,
    ...v,
  }));

  // AI hours saved (month).
  // Same fallback as above — try with analytics_id, retry without it.
  let aiCalls: Array<{
    duration_seconds: number | null;
    analytics_id?: string | null;
    disposition: string | null;
  }> | null = null;

  {
    const { data, error } = await scopeCalls(supabase
      .from('calls')
      .select('duration_seconds, analytics_id, disposition'))
      .eq('ai_processed', true)
      .gte('created_at', monthStart);

    if (error && /column .* does not exist/i.test(error.message)) {
      const retry = await scopeCalls(supabase
        .from('calls')
        .select('duration_seconds, disposition'))
        .eq('ai_processed', true)
        .gte('created_at', monthStart);
      aiCalls = retry.data;
    } else {
      aiCalls = data;
    }
  }

  let transcriptionHours = 0;
  let dispositionMinutes = 0;
  let summaryMinutes = 0;
  for (const c of aiCalls ?? []) {
    const dur = c.duration_seconds ?? 0;
    transcriptionHours += (dur * 0.5) / 3600;
    if (c.analytics_id) summaryMinutes += 2;
    if (c.disposition) dispositionMinutes += 0.5;
  }
  const totalHoursSaved = transcriptionHours + summaryMinutes / 60 + dispositionMinutes / 60;

  // Spam shield — answer rate per number last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('phone_number, is_default')
    .eq('user_id', userId)
    .eq('status', 'active');

  const numberStats: Array<{ number: string; answerRate: number; status: 'clean' | 'warn' | 'flagged' }> = [];
  for (const n of numbers ?? []) {
    const { data: ncalls } = await scopeCalls(supabase
      .from('calls')
      .select('status, duration_seconds'))
      .eq('from_number', n.phone_number)
      .gte('created_at', sevenDaysAgo);

    const total = ncalls?.length ?? 0;
    const answered = ncalls?.filter((c) => c.status === 'completed' && (c.duration_seconds ?? 0) > 5).length ?? 0;
    const rate = total > 3 ? Math.round((answered / total) * 100) : 100;
    numberStats.push({
      number: n.phone_number,
      answerRate: rate,
      status: rate >= 70 ? 'clean' : rate >= 40 ? 'warn' : 'flagged',
    });
  }
  const spamHealth = numberStats.length === 0
    ? 100
    : Math.round(numberStats.reduce((s, n) => s + n.answerRate, 0) / numberStats.length);

  const totalCallsToday = sparklineData.reduce((s, p) => s + p.calls, 0);
  const hasRealData = totalCallsToday > 0 || (aiCalls?.length ?? 0) > 0;

  return NextResponse.json({
    sparkline: sparklineData,
    aiHoursSaved: {
      total: Math.round(totalHoursSaved * 10) / 10,
      transcription: Math.round(transcriptionHours * 10) / 10,
      disposition: Math.round(dispositionMinutes / 60 * 10) / 10,
      summary: Math.round(summaryMinutes / 60 * 10) / 10,
      dollarValue: Math.round(totalHoursSaved * 50),
    },
    spamShield: {
      health: spamHealth,
      numbers: numberStats,
      lastChecked: now.toISOString(),
    },
    hasRealData,
  });
}
