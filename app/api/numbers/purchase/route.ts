import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import { purchaseTwilioNumber } from '@/lib/twilio/number-inventory';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import { normalizeE164 } from '@/lib/inbound/phone';

export async function POST(request: NextRequest) {
  if (!isTwilioVoiceConfigured()) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, monthlyCost, country, numberType } = body as {
      phoneNumber: string;
      monthlyCost?: number;
      country?: string;
      numberType?: string;
    };

    const e164 = normalizeE164(phoneNumber);
    if (!e164) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const purchased = await purchaseTwilioNumber({ phoneNumber: e164, userId });
    if (!purchased) {
      return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
    }

    const workspaceId = await resolveUserWorkspaceId(supabase, userId);

    const { count: existingCount } = await supabase
      .from('purchased_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'released');

    const isDefault = !existingCount || existingCount === 0;
    const purchasedAt = new Date().toISOString();
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const retailCost = monthlyCost ?? calculateRetailPrice(numberType === 'toll_free' ? 2.0 : 1.15);

    const { error: insertError } = await supabase.from('purchased_numbers').insert({
      user_id: userId,
      workspace_id: workspaceId,
      phone_number: purchased.phoneNumber,
      telnyx_number_id: purchased.sid,
      country: country ?? 'US',
      number_type: numberType ?? 'local',
      monthly_cost: retailCost,
      is_default: isDefault,
      status: 'active',
      billing_status: 'active',
      auto_renew: true,
      purchased_at: purchasedAt,
      next_billing_date: nextBillingDate,
    });

    if (insertError) {
      console.error('[NUMBERS-PURCHASE] DB insert failed:', insertError);
      return NextResponse.json({
        success: true,
        phoneNumber: purchased.phoneNumber,
        isDefault,
        warning: 'Number purchased but may not show immediately. Try Sync numbers.',
      });
    }

    if (isDefault) {
      await supabase
        .from('profiles')
        .update({ default_number: purchased.phoneNumber })
        .eq('user_id', userId);
    }

    return NextResponse.json({ success: true, phoneNumber: purchased.phoneNumber, isDefault });
  } catch (error) {
    console.error('[NUMBERS-PURCHASE]', error);
    return NextResponse.json({ error: 'Could not purchase number' }, { status: 500 });
  }
}
