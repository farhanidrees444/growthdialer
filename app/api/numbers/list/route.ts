import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number, country, country_code, country_name, number_type, region, locality, monthly_cost, is_default, status, purchased_at, billing_status, next_billing_date, auto_renew, stripe_subscription_id')
      .eq('user_id', userId)
      .neq('status', 'released')
      .order('is_default', { ascending: false })
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('[NUMBERS-LIST] DB error:', error);
      return NextResponse.json({ error: 'Unable to load numbers' }, { status: 500 });
    }

    const numbers = data ?? [];

    // Enrich each number with call stats (parallel)
    const enriched = await Promise.all(
      numbers.map(async (num) => {
        const [totalRes, connectedRes, recentRes] = await Promise.all([
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('from_number', num.phone_number),
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('from_number', num.phone_number)
            .not('answered_at', 'is', null),
          supabase
            .from('calls')
            .select('created_at')
            .eq('user_id', userId)
            .eq('from_number', num.phone_number)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const total = totalRes.count ?? 0;
        const connected = connectedRes.count ?? 0;

        return {
          ...num,
          stats: {
            total_calls: total,
            connected_calls: connected,
            connect_rate: total > 0 ? Math.round((connected / total) * 100) : 0,
            last_used: recentRes.data?.created_at ?? null,
          },
        };
      }),
    );

    return NextResponse.json({ numbers: enriched });
  } catch (error) {
    console.error('[NUMBERS-LIST] Error:', error);
    return NextResponse.json({ error: 'Unable to load numbers' }, { status: 500 });
  }
}
