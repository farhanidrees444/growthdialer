import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import telnyxClient, { toE164 } from '@/lib/telnyx';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    const body = await request.json();
    const { to, lead_id, call_control_id } = body as {
      to: string;
      lead_id?: string;
      call_control_id?: string; // provided by browser when using WebRTC
    };

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" phone number' }, { status: 400 });
    }

    const e164 = normalizePhone(to) ?? toE164(to);
    console.log(`[dial] original="${to}" normalized="${e164}" webrtc=${!!call_control_id}`);
    if (!e164) {
      return NextResponse.json({ error: 'Phone number format is invalid' }, { status: 400 });
    }

    // Determine from number (user's default purchased number or env fallback)
    let fromNumber = process.env.TELNYX_FROM_NUMBER ?? '';
    if (userId) {
      const { data: defaultNum } = await supabase
        .from('purchased_numbers')
        .select('phone_number')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('status', 'active')
        .single();
      if (defaultNum?.phone_number) fromNumber = defaultNum.phone_number;
    }

    // ── WebRTC mode: browser already dialed via SDK ──────────────────────────
    // call_control_id comes from the TelnyxRTC notification event on the client.
    // We just persist the call record here; Telnyx webhooks update it from here.
    if (call_control_id) {
      if (userId) {
        const { error: insertError } = await supabase.from('calls').insert({
          user_id: userId,
          lead_id: lead_id ?? null,
          to_number: e164,
          from_number: fromNumber,
          telnyx_call_id: call_control_id,
          status: 'initiated',
          created_at: new Date().toISOString(),
        });
        if (insertError) console.error('[dial] insert error:', insertError);
      }
      return NextResponse.json({ call_control_id, to: e164, status: 'initiated' });
    }

    // ── Server-side dial (legacy / fallback when WebRTC unavailable) ─────────
    const webhookUrl = `${process.env.APP_URL}/api/telnyx/webhook`;

    const result = await telnyxClient.calls.dial({
      connection_id: process.env.TELNYX_CONNECTION_ID!,
      to: e164,
      from: fromNumber,
      webhook_url: webhookUrl,
      webhook_url_method: 'POST',
    });

    const newCallControlId = result.data?.call_control_id;

    if (userId && newCallControlId) {
      const { error: insertError } = await supabase.from('calls').insert({
        user_id: userId,
        lead_id: lead_id ?? null,
        to_number: e164,
        from_number: fromNumber,
        telnyx_call_id: newCallControlId,
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
      if (insertError) console.error('[dial] insert error:', insertError);
    }

    return NextResponse.json({
      call_control_id: newCallControlId,
      to: e164,
      status: 'initiated',
    });
  } catch (error) {
    console.error('[dial] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Call could not be connected' },
      { status: 500 },
    );
  }
}
