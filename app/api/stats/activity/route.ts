import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
    const days = period === 'month' ? 30 : 7;
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

    const { data: calls, error } = await supabase
      .from('calls')
      .select('started_at,disposition')
      .eq('user_id', userId)
      .gte('started_at', start.toISOString())
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Activity stats query failed:', error);
      return NextResponse.json({ error: 'Unable to load activity data' }, { status: 500 });
    }

    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return {
        date: formatDate(date),
        calls: 0,
        connects: 0,
        meetings: 0,
      };
    });

    (calls ?? []).forEach((call) => {
      const startedAt = call.started_at ? new Date(call.started_at).toISOString().slice(0, 10) : null;
      if (!startedAt) return;
      const bucket = buckets.find((item) => item.date === startedAt);
      if (!bucket) return;

      bucket.calls += 1;
      if (['Connected', 'Meeting Booked'].includes(call.disposition)) {
        bucket.connects += 1;
      }
      if (call.disposition === 'Meeting Booked') {
        bucket.meetings += 1;
      }
    });

    return NextResponse.json({ period, data: buckets });
  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json({ error: 'Unable to load activity data' }, { status: 500 });
  }
}
