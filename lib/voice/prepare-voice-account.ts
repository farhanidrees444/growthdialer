import type { SupabaseClient } from '@supabase/supabase-js';
import { prepareInboundAccount, type PrepareInboundResult } from '@/lib/inbound/prepare-account';
import { invalidateNumberOwnerCache } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { ensureTwilioVoiceAppConfigured } from '@/lib/twilio/provision-voice-app';
import { configureTwilioNumberVoiceApp } from '@/lib/twilio/configure-phone-number';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';

export interface PrepareVoiceAccountResult extends PrepareInboundResult {
  outbound_ready: boolean;
  default_caller_id: string | null;
  user_id: string;
}

/** Per-account voice setup: numbers, workspace link, default outbound caller ID. */
export async function prepareVoiceAccount(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<PrepareVoiceAccountResult> {
  const inbound = await prepareInboundAccount(supabase, userId, userEmail);

  if (isTwilioVoiceConfigured()) {
    await ensureTwilioVoiceAppConfigured();
  }

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, is_default, status')
    .eq('user_id', userId)
    .neq('status', 'released')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: true });

  const rows = numbers ?? [];
  let defaultCallerId: string | null = null;

  if (rows.length > 0) {
    const hasDefault = rows.some((n) => n.is_default);
    if (!hasDefault) {
      await supabase
        .from('purchased_numbers')
        .update({ is_default: true })
        .eq('id', rows[0].id);
      defaultCallerId = normalizeE164(rows[0].phone_number as string);
    } else {
      const primary = rows.find((n) => n.is_default) ?? rows[0];
      defaultCallerId = normalizeE164(primary.phone_number as string);
    }

    for (const row of rows) {
      invalidateNumberOwnerCache(row.phone_number as string);
      if (isTwilioVoiceConfigured()) {
        void configureTwilioNumberVoiceApp(row.phone_number as string, userId);
      }
    }
  }

  return {
    ...inbound,
    outbound_ready: Boolean(defaultCallerId),
    default_caller_id: defaultCallerId,
    user_id: userId,
  };
}
