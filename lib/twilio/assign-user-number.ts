import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import {
  readTwilioAccountSid,
  readTwilioAuthToken,
  readTwilioTwimlAppSid,
} from '@/lib/twilio/voice-config';
import twilio from 'twilio';

export interface AssignUserNumberInput {
  userId: string;
  phoneNumber: string;
  isDefault?: boolean;
  country?: string;
  countryName?: string;
  numberType?: string;
}

export interface AssignUserNumberResult {
  purchased_number_id: string;
  phone_number: string;
  user_id: string;
  twilio_configured: boolean;
}

async function configureTwilioNumberVoiceApp(e164: string): Promise<boolean> {
  const accountSid = readTwilioAccountSid();
  const authToken = readTwilioAuthToken();
  const twimlAppSid = readTwilioTwimlAppSid();
  if (!accountSid || !authToken || !twimlAppSid) return false;

  try {
    const client = twilio(accountSid, authToken);
    const matches = await client.incomingPhoneNumbers.list({ phoneNumber: e164, limit: 1 });
    const incoming = matches[0];
    if (!incoming?.sid) return false;

    await client.incomingPhoneNumbers(incoming.sid).update({
      voiceApplicationSid: twimlAppSid,
    });
    return true;
  } catch (err) {
    console.error('[assign-number] Twilio voice app update failed:', err);
    return false;
  }
}

/**
 * Assign (or reassign) a voice line to a user in purchased_numbers.
 * Uses service role — caller must be a platform admin.
 */
export async function assignUserNumber(
  supabase: SupabaseClient,
  input: AssignUserNumberInput,
): Promise<AssignUserNumberResult> {
  const e164 = normalizeE164(input.phoneNumber);
  if (!e164 || e164.length < 11) {
    throw new Error('Phone number must be a valid E.164 value');
  }

  const workspaceId = await resolveUserWorkspaceId(supabase, input.userId);
  const isDefault = input.isDefault !== false;

  const { data: existingOwner } = await supabase
    .from('purchased_numbers')
    .select('id, user_id')
    .eq('phone_number', e164)
    .neq('status', 'released')
    .maybeSingle();

  if (existingOwner?.user_id && existingOwner.user_id !== input.userId) {
    throw new Error('This number is already assigned to another account');
  }

  if (isDefault) {
    await supabase
      .from('purchased_numbers')
      .update({ is_default: false })
      .eq('user_id', input.userId)
      .neq('status', 'released');
  }

  const row = {
    user_id: input.userId,
    workspace_id: workspaceId,
    phone_number: e164,
    status: 'active' as const,
    is_default: isDefault,
    country: input.country ?? 'US',
    country_name: input.countryName ?? null,
    number_type: input.numberType ?? 'local',
    telnyx_number_id: null,
    telnyx_order_id: null,
  };

  let purchasedNumberId: string;

  if (existingOwner?.id) {
    const { data: updated, error } = await supabase
      .from('purchased_numbers')
      .update(row)
      .eq('id', existingOwner.id)
      .select('id')
      .single();
    if (error || !updated?.id) {
      throw new Error(error?.message ?? 'Could not update number assignment');
    }
    purchasedNumberId = updated.id as string;
  } else {
    const { data: inserted, error } = await supabase
      .from('purchased_numbers')
      .insert(row)
      .select('id')
      .single();
    if (error || !inserted?.id) {
      throw new Error(error?.message ?? 'Could not assign number');
    }
    purchasedNumberId = inserted.id as string;
  }

  const twilioConfigured = await configureTwilioNumberVoiceApp(e164);

  return {
    purchased_number_id: purchasedNumberId,
    phone_number: e164,
    user_id: input.userId,
    twilio_configured: twilioConfigured,
  };
}
