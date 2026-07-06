import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extendBillingDate } from '@/lib/numbers/billing-lifecycle';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: row, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('id, next_billing_date, stripe_subscription_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    if (row.status === 'released') {
      return NextResponse.json({ error: 'Number has been released' }, { status: 400 });
    }

    if (row.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription lines renew automatically' },
        { status: 400 },
      );
    }

    const nextBillingDate = extendBillingDate(row.next_billing_date);

    const { error: updateError } = await supabase
      .from('purchased_numbers')
      .update({
        next_billing_date: nextBillingDate,
        billing_status: 'active',
        status: 'active',
        auto_renew: true,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Could not extend line' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      next_billing_date: nextBillingDate,
    });
  } catch (error) {
    console.error('[NUMBERS-EXTEND]', error);
    return NextResponse.json({ error: 'Could not extend line' }, { status: 500 });
  }
}
