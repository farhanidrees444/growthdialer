import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    const userEmail = authUser?.email ?? '';
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

    // Build order — include customer_reference so the order is tagged to this user
    const orderBody: Record<string, unknown> = {
      phone_numbers: [{ phone_number: phoneNumber }],
      customer_reference: userId,
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
      const errText = await res.text();
      console.error('[NUMBERS-PURCHASE] Order failed:', errText);
      return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
    }

    const orderData = await res.json() as {
      data?: { id?: string; phone_numbers?: { id?: string }[] };
    };
    const orderId = orderData.data?.id;
    const telnyxNumberId = orderData.data?.phone_numbers?.[0]?.id;

    // Tag the number with owner's user_id so sync can recover it later
    if (telnyxNumberId) {
      const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();
      fetch(`https://api.telnyx.com/v2/phone_numbers/${telnyxNumberId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [`user:${userId}`, `email:${userEmail}`],
          ...(connectionId ? { connection_id: connectionId } : {}),
        }),
      }).catch((err) => console.error('[NUMBERS-PURCHASE] Tag failed (non-critical):', err));
    }

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
      number_type: numberType ?? 'local',
      monthly_cost: monthlyCost ?? 1.00,
      is_default: isDefault,
      status: 'active',
      billing_status: 'active',
      auto_renew: true,
      purchased_at: purchasedAt,
      next_billing_date: nextBillingDate,
    });

    if (insertError) {
      console.error('[NUMBERS-PURCHASE] DB INSERT FAILED:', insertError);
      console.error('[NUMBERS-PURCHASE] Provider number was purchased:', phoneNumber);
      return NextResponse.json({
        success: true,
        phoneNumber,
        isDefault,
        warning: 'Number purchased but may not show immediately. Try the Sync button.',
      });
    }

    console.log('[NUMBERS-PURCHASE] Success:', phoneNumber, 'for user:', userId);
    return NextResponse.json({ success: true, phoneNumber, isDefault });
  } catch (error) {
    console.error('[NUMBERS-PURCHASE] Error:', error);
    return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
  }
}
