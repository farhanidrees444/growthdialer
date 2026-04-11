import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDayUTC(now);
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const tomorrowStart = tomorrow.toISOString();
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const yesterdayStart = yesterday.toISOString();
    const todayEnd = todayStart;

    const [{ count: callsToday }, { count: connectsToday }, { count: meetingsToday }, { count: callsYesterday }, { count: connectsYesterday }] = await Promise.all([
      supabase.from('calls').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('started_at', todayStart).lt('started_at', tomorrowStart),
      supabase.from('calls').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('disposition', ['Connected', 'Meeting Booked']).gte('started_at', todayStart).lt('started_at', tomorrowStart),
      supabase.from('calls').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('disposition', 'Meeting Booked').gte('started_at', todayStart).lt('started_at', tomorrowStart),
      supabase.from('calls').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('started_at', yesterdayStart).lt('started_at', todayStart),
      supabase.from('calls').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('disposition', ['Connected', 'Meeting Booked']).gte('started_at', yesterdayStart).lt('started_at', todayStart),
    ]);

    const callsCount = callsToday ?? 0;
    const connectsCount = connectsToday ?? 0;
    const meetingsCount = meetingsToday ?? 0;
    const connectRate = callsCount ? Math.round((connectsCount / Math.max(callsCount, 1)) * 10000) / 100 : 0;
    const pipelineValue = meetingsCount * 5000;
    const yesterdayRate = (callsYesterday ?? 0) ? Math.round(((connectsYesterday ?? 0) / Math.max(callsYesterday ?? 1, 1)) * 10000) / 100 : 0;

    return NextResponse.json({
      callsToday: callsCount,
      connectRate: connectRate,
      meetingsBooked: meetingsCount,
      pipelineValue,
      yesterday: {
        calls: callsYesterday ?? 0,
        connectRate: yesterdayRate,
      },
    });
  } catch (error) {
    console.error('Stats today error:', error);
    return NextResponse.json({ error: 'Unable to load stats' }, { status: 500 });
  }
}
