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

    console.log('[NUMBERS-SYNC] Starting for user:', userId);

    const res = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=250', {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
    });

    if (!res.ok) {
      console.error('[NUMBERS-SYNC] Provider fetch failed:', res.status, await res.text());
      return NextResponse.json({ error: 'Failed to fetch numbers from provider' }, { status: 500 });
    }

    const { data: telnyxNumbers } = await res.json() as { data?: Record<string, unknown>[] };
    let synced = 0;
    let skipped = 0;

    for (const num of telnyxNumbers ?? []) {
      const phoneNumber = num.phone_number as string;
      const telnyxNumberId = num.id as string;
      const tags = (num.tags as string[] | null) ?? [];
      const wholesale = parseFloat(
        ((num.costs as { monthly?: { amount?: string } } | null)?.monthly?.amount) ?? '1.00'
      );
      const purchasedAt = (num.created_at as string | null) ?? new Date().toISOString();
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Determine ownership from Telnyx tag
      const userTag = tags.find((t) => t.startsWith('user:'));
      const tagUserId = userTag?.replace('user:', '') ?? null;

      // If tagged to a different user — never touch this number
      if (tagUserId && tagUserId !== userId) {
        console.log('[NUMBERS-SYNC] Skipping', phoneNumber, '— tagged to another user');
        skipped++;
        continue;
      }

      // If untagged and not in DB under this user — do not auto-claim
      const { data: existing } = await supabase
        .from('purchased_numbers')
        .select('id, user_id')
        .eq('telnyx_number_id', telnyxNumberId)
        .maybeSingle();

      if (existing) {
        if (existing.user_id === userId) {
          // Already mine — refresh status fields
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
        } else if (tagUserId === userId) {
          // Tagged to me but DB has wrong owner — correct it
          console.log('[NUMBERS-SYNC] Correcting ownership for', phoneNumber);
          const { error } = await supabase
            .from('purchased_numbers')
            .update({ user_id: userId, status: 'active', billing_status: 'active' })
            .eq('id', existing.id);
          if (!error) synced++;
          else console.error('[NUMBERS-SYNC] Ownership correction error:', error);
        } else {
          // In DB under a different user, not tagged to me — skip
          skipped++;
        }
      } else if (tagUserId === userId) {
        // Tagged to me, not in DB at all — recover it
        console.log('[NUMBERS-SYNC] Recovering tagged number:', phoneNumber);
        const { error } = await supabase
          .from('purchased_numbers')
          .insert({
            user_id: userId,
            telnyx_number_id: telnyxNumberId,
            phone_number: phoneNumber,
            country: (num.country_code as string | null) ?? 'US',
            number_type: (num.phone_number_type as string | null) ?? 'local',
            status: (num.status as string) === 'active' ? 'active' : 'inactive',
            monthly_cost: wholesale,
            billing_status: 'active',
            auto_renew: true,
            purchased_at: purchasedAt,
            next_billing_date: nextBillingDate,
          });
        if (!error) synced++;
        else console.error('[NUMBERS-SYNC] Recovery insert error for', phoneNumber, ':', error);
      } else {
        // Untagged number not in DB — do not auto-claim
        skipped++;
      }
    }

    // Auto-set default if user has none
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

    const message = synced > 0
      ? `Recovered ${synced} number${synced !== 1 ? 's' : ''} tagged to your account`
      : 'No numbers to recover. Buy new numbers through the app.';

    console.log('[NUMBERS-SYNC] Done. Synced:', synced, 'Skipped:', skipped);
    return NextResponse.json({ synced, skipped, total: telnyxNumbers?.length ?? 0, message });
  } catch (err) {
    console.error('[NUMBERS-SYNC] Exception:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Export for pricing reuse
export { calculateRetailPrice };
