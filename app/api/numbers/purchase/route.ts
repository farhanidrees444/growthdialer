import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, monthlyCost, country } = body as {
      phoneNumber: string;
      monthlyCost?: number;
      country?: string;
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

    const { error: insertError } = await supabase.from('purchased_numbers').insert({
      user_id: userId,
      phone_number: phoneNumber,
      telnyx_number_id: telnyxNumberId ?? null,
      telnyx_order_id: orderId ?? null,
      country: country ?? 'US',
      monthly_cost: monthlyCost ?? 1.00,
      is_default: isDefault,
      status: 'active',
      purchased_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to save purchased number:', insertError);
      return NextResponse.json({ error: 'Number purchased but could not be saved' }, { status: 500 });
    }

    return NextResponse.json({ success: true, phoneNumber, isDefault });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
  }
}
