import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import telnyxClient, { toE164 } from '@/lib/telnyx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    const body = await request.json();
    const { to, lead_id } = body as { to: string; lead_id?: string };

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" phone number' }, { status: 400 });
    }

    const e164 = toE164(to);
    if (!e164) {
      return NextResponse.json({ error: 'Invalid phone number — must be E.164 or 10-digit US number' }, { status: 400 });
    }

    // Use the user's default purchased number if available
    let fromNumber = process.env.TELNYX_FROM_NUMBER!;
    if (userId) {
      const { data: defaultNum } = await supabase
        .from('purchased_numbers')
        .select('phone_number')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('status', 'active')
        .single();
      if (defaultNum?.phone_number) {
        fromNumber = defaultNum.phone_number;
      }
    }

    const webhookUrl = `${process.env.APP_URL}/api/telnyx/webhook`;

    const result = await telnyxClient.calls.dial({
      connection_id: process.env.TELNYX_CONNECTION_ID!,
      to: e164,
      from: fromNumber,
      webhook_url: webhookUrl,
      webhook_url_method: 'POST',
    });

    const callControlId = result.data?.call_control_id;

    if (userId && callControlId) {
      const { error: insertError } = await supabase.from('calls').insert({
        user_id: userId,
        lead_id: lead_id ?? null,
        to_number: e164,
        from_number: fromNumber,
        telnyx_call_id: callControlId,
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
      if (insertError) {
        console.error('Failed to insert call record:', insertError);
      }
    }

    return NextResponse.json({
      call_control_id: callControlId,
      to: e164,
      status: 'initiated',
    });
  } catch (error) {
    console.error('Dial error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to dial' },
      { status: 500 },
    );
  }
}
