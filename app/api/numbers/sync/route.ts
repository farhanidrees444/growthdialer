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
      const telnyxNumberId = num.id as string;
      const wholesale = parseFloat(
        ((num.costs as { monthly?: { amount?: string } } | null)?.monthly?.amount) ?? '1.00'
      );
      const purchasedAt = (num.created_at as string | null) ?? new Date().toISOString();
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Check if this telnyx_number_id already exists in DB
      const { data: existing } = await supabase
        .from('purchased_numbers')
        .select('id, user_id')
        .eq('telnyx_number_id', telnyxNumberId)
        .maybeSingle();

      if (existing) {
        if (existing.user_id === userId) {
          // Belongs to current user — update status/cost fields only
          const { error } = await supabase
            .from('purchased_numbers')
            .update({
              phone_number: phoneNumber,
              status: (num.status as string) === 'active' ? 'active' : 'inactive',
              monthly_cost: wholesale,
              billing_status: 'active',
              next_billing_date: nextBillingDate,
            })
            .eq('id', existing.id);
          if (!error) synced++;
          else console.error('[NUMBERS-SYNC] Update error for', phoneNumber, ':', error);
        } else {
          // Belongs to a different user — never reassign ownership
          console.warn('[NUMBERS-SYNC] Number', phoneNumber, 'belongs to another user — skipping');
        }
      } else {
        // New number — insert and assign to the authenticated user
        const { error } = await supabase
          .from('purchased_numbers')
          .insert({
            user_id: userId,
            telnyx_number_id: telnyxNumberId,
            phone_number: phoneNumber,
            country: (num.country_code as string | null) ?? 'US',
            country_code: (num.country_code as string | null) ?? 'US',
            number_type: (num.phone_number_type as string | null) ?? 'local',
            status: (num.status as string) === 'active' ? 'active' : 'inactive',
            monthly_cost: wholesale,
            billing_status: 'active',
            auto_renew: true,
            purchased_at: purchasedAt,
            next_billing_date: nextBillingDate,
          });
        if (!error) synced++;
        else console.error('[NUMBERS-SYNC] Insert error for', phoneNumber, ':', error);
      }
    }

    // Auto-set default number if user has none
    if (synced > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_number')
        .eq('user_id', userId)
        .single();

      if (!profile?.default_number) {
        const { data: firstNumber } = await supabase
          .from('purchased_numbers')
          .select('phone_number')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('purchased_at', { ascending: true })
          .limit(1)
          .single();

        if (firstNumber?.phone_number) {
          await supabase
            .from('profiles')
            .update({ default_number: firstNumber.phone_number })
            .eq('user_id', userId);
        }
      }
    }

    console.log('[NUMBERS-SYNC] Synced:', synced, 'numbers for user:', userId);
    return NextResponse.json({ synced, total: telnyxNumbers?.length ?? 0 });
  } catch (err) {
    console.error('[NUMBERS-SYNC] Exception:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Export for pricing reuse
export { calculateRetailPrice };
