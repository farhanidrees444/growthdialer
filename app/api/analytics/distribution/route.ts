import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
    ).toISOString();

    // Lead status distribution
    const { data: leads } = await supabase
      .from('leads')
      .select('status')
      .eq('user_id', userId);

    const statusCounts: Record<string, number> = {};
    for (const lead of leads ?? []) {
      const s = lead.status ?? 'new';
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }));

    // Hour-of-day analysis for answered calls (last 30 days)
    const { data: answeredCalls } = await supabase
      .from('calls')
      .select('answered_at')
      .eq('user_id', userId)
      .not('answered_at', 'is', null)
      .gte('created_at', thirtyDaysAgo);

    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
      connects: 0,
    }));

    for (const call of answeredCalls ?? []) {
      if (!call.answered_at) continue;
      const h = new Date(call.answered_at).getUTCHours();
      hourBuckets[h].connects += 1;
    }

    // Weekly metrics: calls/connects per week for last 4 weeks
    const { data: callsData } = await supabase
      .from('calls')
      .select('created_at, answered_at, status')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    const weekBuckets = Array.from({ length: 4 }, (_, w) => {
      const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6 - (3 - w) * 7));
      const weekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (3 - w) * 7));
      return {
        week: `W${w + 1}`,
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        calls: 0,
        connects: 0,
        connectRate: 0,
      };
    });

    for (const call of callsData ?? []) {
      if (!call.created_at) continue;
      const callDate = call.created_at;
      const bucket = weekBuckets.find((b) => callDate >= b.start && callDate < b.end);
      if (!bucket) continue;
      bucket.calls += 1;
      if (call.answered_at) bucket.connects += 1;
    }

    for (const bucket of weekBuckets) {
      bucket.connectRate = bucket.calls > 0 ? Math.round((bucket.connects / bucket.calls) * 1000) / 10 : 0;
    }

    return NextResponse.json({
      statusDistribution,
      hourlyConnects: hourBuckets,
      weeklyTrend: weekBuckets,
    });
  } catch (error) {
    console.error('Analytics distribution error:', error);
    return NextResponse.json({ error: 'Unable to load analytics data' }, { status: 500 });
  }
}
