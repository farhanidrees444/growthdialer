import { NextRequest, NextResponse } from 'next/server';
import { twilioClient, isValidPhoneNumber, isPremiumNumber } from '@/lib/twilio';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, leadId } = body;
    const destination = typeof to === 'string' ? to.trim() : '';

    if (!destination) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    if (!isValidPhoneNumber(destination)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    if (isPremiumNumber(destination)) {
      return NextResponse.json(
        { error: 'Premium numbers are not allowed' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: callRecord, error: createError } = await supabase.from('calls').insert({
      user_id: userId,
      lead_id: leadId ?? undefined,
      status: 'initiated',
      direction: 'outbound',
      to_number: destination,
      from_number: process.env.TWILIO_PHONE_NUMBER ?? undefined,
      started_at: now,
      created_at: now,
      updated_at: now,
    }).select('id').single();

    if (createError || !callRecord) {
      console.error('Failed to create initial call record:', createError);
      return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 });
    }

    const call = await twilioClient.calls.create({
      to: destination,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/outbound-twiml`,
      method: 'POST',
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer'],
      statusCallbackMethod: 'POST',
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording-status`,
      recordingStatusCallbackMethod: 'POST',
      record: true,
      timeout: 30,
    });

    await supabase.from('calls').update({
      twilio_call_sid: call.sid,
      status: call.status ?? 'initiated',
      updated_at: new Date().toISOString(),
    }).eq('id', callRecord.id);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      to: call.to,
      from: call.from,
      status: call.status,
    });

  } catch (error) {
    console.error('Outbound call error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}