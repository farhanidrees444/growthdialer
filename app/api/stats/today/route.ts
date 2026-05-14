import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    ] = await Promise.all([
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('answered_at', 'is', null)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('answered_at', 'is', null)
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const total = callsToday ?? 0;
    const answered = answeredToday ?? 0;
    const connectRate = total ? Math.round((answered / total) * 10000) / 100 : 0;
    const pipelineValue = (leadsCount ?? 0) * 5000;

    const totalYesterday = callsYesterday ?? 0;
    const answeredYesterdayCount = answeredYesterday ?? 0;
    const yesterdayRate = totalYesterday
      ? Math.round((answeredYesterdayCount / totalYesterday) * 10000) / 100
      : 0;

    return NextResponse.json({
      callsToday: total,
      connectRate,
      meetingsBooked: 0,
      pipelineValue,
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
