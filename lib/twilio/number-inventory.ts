import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { readTwilioTwimlAppSid } from '@/lib/twilio/voice-config';
import {
  configureTwilioNumberVoiceApp,
  parseUserIdFromTwilioFriendlyName,
  twilioNumberFriendlyName,
} from '@/lib/twilio/configure-phone-number';

export interface TwilioAvailableNumber {
  phoneNumber: string;
  type: string;
  city: string;
  state: string;
  monthlyCost: number;
  currency: string;
}

export async function searchTwilioAvailableNumbers(input: {
  country?: string;
  areaCode?: string;
  type?: string;
  limit?: number;
}): Promise<TwilioAvailableNumber[]> {
  const client = getTwilioRestClient();
  if (!client) return [];

  const country = (input.country ?? 'US').toUpperCase();
  const limit = Math.min(input.limit ?? 12, 30);
  const isTollFree = input.type === 'toll_free';

  try {
    const areaCodeNum =
      !isTollFree && input.areaCode?.length === 3
        ? Number.parseInt(input.areaCode, 10)
        : undefined;

    const available = isTollFree
      ? await client.availablePhoneNumbers(country).tollFree.list({ limit })
      : await client.availablePhoneNumbers(country).local.list({
          limit,
          ...(areaCodeNum ? { areaCode: areaCodeNum } : {}),
        });

    const wholesale = isTollFree ? 2.0 : 1.15;

    return available.map((n) => ({
      phoneNumber: n.phoneNumber,
      type: isTollFree ? 'toll_free' : 'local',
      city: (n.locality as string | undefined) ?? '',
      state: (n.region as string | undefined) ?? '',
      monthlyCost: calculateRetailPrice(wholesale),
      currency: 'USD',
    }));
  } catch (err) {
    console.error('[Twilio] number search failed:', err);
    return [];
  }
}

export async function purchaseTwilioNumber(input: {
  phoneNumber: string;
  userId: string;
}): Promise<{ sid: string; phoneNumber: string } | null> {
  const client = getTwilioRestClient();
  const twimlAppSid = readTwilioTwimlAppSid();
  const e164 = normalizeE164(input.phoneNumber);
  if (!client || !twimlAppSid || !e164) return null;

  try {
    const created = await client.incomingPhoneNumbers.create({
      phoneNumber: e164,
      voiceApplicationSid: twimlAppSid,
      friendlyName: twilioNumberFriendlyName(input.userId),
    });
    return { sid: created.sid, phoneNumber: created.phoneNumber };
  } catch (err) {
    console.error('[Twilio] number purchase failed:', err);
    return null;
  }
}

export async function releaseTwilioNumber(sid: string): Promise<boolean> {
  const client = getTwilioRestClient();
  if (!client || !sid) return false;

  try {
    return await client.incomingPhoneNumbers(sid).remove();
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return true;
    console.error('[Twilio] number release failed:', err);
    return false;
  }
}

export async function syncTwilioNumbersForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  options?: { claimOrphans?: boolean },
): Promise<{ synced: number; skipped: number; total: number; message: string }> {
  const client = getTwilioRestClient();
  if (!client) {
    return { synced: 0, skipped: 0, total: 0, message: 'Voice service is not configured' };
  }

  const workspaceId = await resolveUserWorkspaceId(supabase, userId);
  const claimOrphans = options?.claimOrphans ?? false;
  const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 200 });

  let synced = 0;
  let skipped = 0;

  for (const num of twilioNumbers) {
    const phoneNumber = normalizeE164(num.phoneNumber) ?? num.phoneNumber;
    const taggedUserId = parseUserIdFromTwilioFriendlyName(num.friendlyName);

    const { data: existing } = await supabase
      .from('purchased_numbers')
      .select('id, user_id, telnyx_number_id')
      .eq('phone_number', phoneNumber)
      .neq('status', 'released')
      .maybeSingle();

    if (existing?.user_id && existing.user_id !== userId) {
      skipped += 1;
      continue;
    }

    const ownedByUser =
      existing?.user_id === userId
      || taggedUserId === userId
      || (claimOrphans && !existing && !taggedUserId);

    if (!ownedByUser) {
      skipped += 1;
      continue;
    }

    await configureTwilioNumberVoiceApp(phoneNumber, userId);

    const purchasedAt = new Date().toISOString();
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const wholesale = num.phoneNumber.startsWith('+1800') || num.phoneNumber.startsWith('+1888') ? 2.0 : 1.15;

    if (existing?.id) {
      const { error } = await supabase
        .from('purchased_numbers')
        .update({
          user_id: userId,
          workspace_id: workspaceId,
          telnyx_number_id: num.sid,
          status: 'active',
          billing_status: 'active',
          monthly_cost: calculateRetailPrice(wholesale),
          next_billing_date: nextBillingDate,
        })
        .eq('id', existing.id);
      if (!error) synced += 1;
      else skipped += 1;
    } else {
      const { count } = await supabase
        .from('purchased_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'released');

      const { error } = await supabase.from('purchased_numbers').insert({
        user_id: userId,
        workspace_id: workspaceId,
        phone_number: phoneNumber,
        telnyx_number_id: num.sid,
        country: 'US',
        number_type: phoneNumber.includes('800') ? 'toll_free' : 'local',
        status: 'active',
        is_default: (count ?? 0) === 0,
        monthly_cost: calculateRetailPrice(wholesale),
        billing_status: 'active',
        auto_renew: true,
        purchased_at: purchasedAt,
        next_billing_date: nextBillingDate,
      });
      if (!error) synced += 1;
      else skipped += 1;
    }
  }

  if (synced > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.default_number) {
      const { data: firstNumber } = await supabase
        .from('purchased_numbers')
        .select('phone_number')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (firstNumber?.phone_number) {
        await supabase
          .from('profiles')
          .update({ default_number: firstNumber.phone_number })
          .eq('user_id', userId);
      }
    }
  }

  const message =
    synced > 0
      ? `Linked ${synced} number${synced !== 1 ? 's' : ''} to your account`
      : skipped > 0 && twilioNumbers.length > 0
        ? `${skipped} line${skipped !== 1 ? 's' : ''} in your voice account could not be linked.`
        : 'No numbers found in your voice account. Buy a number to get started.';

  return { synced, skipped, total: twilioNumbers.length, message };
}
