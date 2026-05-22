import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('[NUMBERS-SYNC] Fetching numbers from provider for user:', userId);

    const res = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=250', {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
    });

    if (!res.ok) {
      console.error('[NUMBERS-SYNC] Provider fetch failed:', res.status, await res.text());
      return NextResponse.json({ error: 'Failed to fetch numbers from provider' }, { status: 500 });
    }

    const { data: telnyxNumbers } = await res.json() as { data?: Record<string, unknown>[] };
    let synced = 0;

    for (const num of telnyxNumbers ?? []) {
      const phoneNumber = num.phone_number as string;
      const wholesale = parseFloat(
        ((num.costs as { monthly?: { amount?: string } } | null)?.monthly?.amount) ?? '1.00'
      );
      const purchasedAt = (num.created_at as string | null) ?? new Date().toISOString();
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('purchased_numbers')
        .upsert({
          user_id: userId,
          telnyx_number_id: num.id as string,
          phone_number: phoneNumber,
          country: (num.country_code as string | null) ?? 'US',
          country_code: (num.country_code as string | null) ?? 'US',
          number_type: (num.phone_number_type as string | null) ?? 'local',
          status: (num.status as string) === 'active' ? 'active' : 'inactive',
          monthly_cost: wholesale,
          billing_status: 'unpaid',
          auto_renew: true,
          purchased_at: purchasedAt,
          next_billing_date: nextBillingDate,
        }, { onConflict: 'telnyx_number_id' });

      if (!error) {
        synced++;
      } else {
        console.error('[NUMBERS-SYNC] Upsert error for', phoneNumber, ':', error);
      }
    }

    console.log('[NUMBERS-SYNC] Synced:', synced, 'numbers for user:', userId);
    return NextResponse.json({ synced });
  } catch (err) {
    console.error('[NUMBERS-SYNC] Exception:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Export for pricing reuse
export { calculateRetailPrice };
