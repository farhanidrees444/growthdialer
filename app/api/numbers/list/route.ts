import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeNumberHealth } from '@/lib/numbers/health';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized', numbers: [] }, { status: 401 });

    const { data: numbers, error } = await supabase
      .from('purchased_numbers')
      .select(`
        id, phone_number, telnyx_number_id, country, number_type,
        monthly_cost, is_default, status, purchased_at,
        billing_status, next_billing_date, auto_renew, stripe_subscription_id,
        spam_score, last_spam_check,
        label, health_score, spam_status
      `)
      .eq('user_id', user.id)
      .neq('status', 'released')
      .order('is_default', { ascending: false })
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('[NUMBERS-LIST] DB error:', error);
      return NextResponse.json({ error: error.message, numbers: [] }, { status: 500 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const withStats = await Promise.all(
      (numbers || []).map(async (num) => {
        const [totalRes, connectedRes, lastRes] = await Promise.all([
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('from_number', num.phone_number)
            .gte('started_at', thirtyDaysAgo),
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('from_number', num.phone_number)
            .not('answered_at', 'is', null)
            .gte('started_at', thirtyDaysAgo),
          supabase
            .from('calls')
            .select('started_at')
            .eq('user_id', user.id)
            .eq('from_number', num.phone_number)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const total = totalRes.count ?? 0;
        const connected = connectedRes.count ?? 0;
        const connectRate = total > 0 ? Math.round((connected / total) * 100) : 0;
        const health = computeNumberHealth({
          spam_status: num.spam_status,
          spam_score: num.spam_score,
          last_spam_check: num.last_spam_check,
          total_calls: total,
          connect_rate: connectRate,
        });

        return {
          ...num,
          stats: {
            total_calls: total,
            connected,
            connect_rate: connectRate,
            last_used: lastRes.data?.started_at ?? null,
          },
          ...health,
        };
      }),
    );

    console.log('[NUMBERS-LIST]', user.email, 'count:', withStats.length);
    return NextResponse.json({ numbers: withStats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NUMBERS-LIST] Crash:', msg);
    return NextResponse.json({ error: msg, numbers: [] }, { status: 500 });
  }
}
