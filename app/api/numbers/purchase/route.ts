import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, monthlyCost, country, countryName, numberType, locality, region } = body as {
      phoneNumber: string;
      monthlyCost?: number;
      country?: string;
      countryName?: string;
      numberType?: string;
      locality?: string;
      region?: string;
    };

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const orderBody: Record<string, unknown> = {
      phone_numbers: [{ phone_number: phoneNumber }],
    };
    if (process.env.TELNYX_CONNECTION_ID) {
      orderBody.connection_id = process.env.TELNYX_CONNECTION_ID;
    }

    const res = await fetch('https://api.telnyx.com/v2/number_orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    if (!res.ok) {
      console.error('Number purchase failed:', await res.text());
      return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
    }

    const orderData = await res.json();
    const orderId = orderData.data?.id as string | undefined;
    const purchasedPhoneData = orderData.data?.phone_numbers?.[0] as { id?: string } | undefined;
    const telnyxNumberId = purchasedPhoneData?.id;

    // First number for this user becomes default automatically
    const { count: existingCount } = await supabase
      .from('purchased_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const isDefault = !existingCount || existingCount === 0;

    const purchasedAt = new Date().toISOString();
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('purchased_numbers').insert({
      user_id: userId,
      phone_number: phoneNumber,
      telnyx_number_id: telnyxNumberId ?? null,
      telnyx_order_id: orderId ?? null,
      country: country ?? 'US',
      country_code: country ?? 'US',
      country_name: countryName ?? null,
      number_type: numberType ?? 'local',
      locality: locality ?? null,
      region: region ?? null,
      monthly_cost: monthlyCost ?? 1.00,
      is_default: isDefault,
      status: 'active',
      billing_status: 'unpaid',
      auto_renew: true,
      purchased_at: purchasedAt,
      next_billing_date: nextBillingDate,
    });

    if (insertError) {
      // CRITICAL: Number was purchased from provider but DB insert failed.
      // Don't show generic error — this needs visibility.
      console.error('[NUMBERS-PURCHASE] DB INSERT FAILED:', insertError);
      console.error('[NUMBERS-PURCHASE] Provider number was purchased:', phoneNumber);
      // Return success with warning so user knows to check dashboard
      return NextResponse.json({
        success: true,
        phoneNumber,
        isDefault,
        warning: 'Number purchased but may not show immediately. Try the Sync button.',
      });
    }

    return NextResponse.json({ success: true, phoneNumber, isDefault });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
  }
}
