import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  const { data: expired, error: fetchErr } = await supabase
    .from('purchased_numbers')
    .select('*')
    .eq('status', 'active')
    .is('stripe_subscription_id', null)
    .lt('next_billing_date', new Date().toISOString());

  if (fetchErr) {
    console.error('[CRON-NUMBERS] Fetch error:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let released = 0;

  for (const number of expired ?? []) {
    const telnyxId = (number as Record<string, unknown>).telnyx_number_id as string | null;
    const phoneNumber = (number as Record<string, unknown>).phone_number as string;
    const numberId = (number as Record<string, unknown>).id as string;
    const userId = (number as Record<string, unknown>).user_id as string;

    if (telnyxId) {
      try {
        const res = await fetch(
          `https://api.telnyx.com/v2/phone_numbers/${encodeURIComponent(telnyxId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
          },
        );
        if (!res.ok && res.status !== 404) {
          console.error('[CRON-NUMBERS] Provider release failed:', phoneNumber, res.status);
          continue;
        }
      } catch (err) {
        console.error('[CRON-NUMBERS] Provider release exception:', phoneNumber, err);
        continue;
      }
    }

    await supabase
      .from('purchased_numbers')
      .update({ status: 'released', released_at: new Date().toISOString(), is_default: false })
      .eq('id', numberId);

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Number Released',
      message: `${phoneNumber} has been released (no active subscription). Purchase a new number to replace it.`,
      type: 'warning',
      read: false,
    }).maybeSingle();

    released++;
    console.log('[CRON-NUMBERS] Released:', phoneNumber);
  }

  return NextResponse.json({ released });
}
