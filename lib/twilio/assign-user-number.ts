import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { configureTwilioNumberVoiceApp } from '@/lib/twilio/configure-phone-number';

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

  const row: Record<string, unknown> = {
    user_id: input.userId,
    workspace_id: workspaceId,
    phone_number: e164,
    status: 'active',
    is_default: isDefault,
    country: input.country ?? 'US',
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

  const twilioConfigured = await configureTwilioNumberVoiceApp(e164, input.userId);

  return {
    purchased_number_id: purchasedNumberId,
    phone_number: e164,
    user_id: input.userId,
    twilio_configured: twilioConfigured,
  };
}
