import type { SupabaseClient } from '@supabase/supabase-js';
import { prepareInboundAccount, type PrepareInboundResult } from '@/lib/inbound/prepare-account';
import { invalidateNumberOwnerCache } from '@/lib/inbound/number-owner-cache';
import { resolvePerUserCredentialId } from '@/lib/telnyx/active-credential';
import { normalizeE164 } from '@/lib/inbound/phone';

export interface PrepareVoiceAccountResult extends PrepareInboundResult {
  outbound_ready: boolean;
  default_caller_id: string | null;
  user_id: string;
}

/**
 * One-shot per-account repair: numbers → Call Control app, workspace link,
 * per-user WebRTC credential, default outbound caller ID.
 */
export async function prepareVoiceAccount(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<PrepareVoiceAccountResult> {
  const inbound = await prepareInboundAccount(supabase, userId, userEmail);

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
    }
  }

  const credentialId = await resolvePerUserCredentialId(supabase, userId);
  const outboundReady = Boolean(credentialId && defaultCallerId);

  return {
    ...inbound,
    outbound_ready: outboundReady,
    default_caller_id: defaultCallerId,
    user_id: userId,
  };
}
