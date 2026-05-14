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
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)),
    );

    const { data: calls, error } = await supabase
      .from('calls')
      .select('created_at, answered_at, status')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

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
