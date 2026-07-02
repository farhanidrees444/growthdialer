import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';

/**
 * Inbound routing decisions (off/voicemail/forward/browser ring-group) live
 * in `lib/telephony/telnyx/inbound-router.ts`. This module only holds the
 * recording-policy lookup shared by the webhook processor.
 */
export async function shouldRecordInboundAnswer(
  supabase: SupabaseClient,
  userId: string,
  purchasedNumberId: string | undefined,
  toNumber: string | undefined,
): Promise<boolean> {
  let numberId = purchasedNumberId;
  if (!numberId && toNumber) {
    const { data } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('phone_number', normalizeE164(toNumber))
      .neq('status', 'released')
      .limit(1)
      .maybeSingle();
    numberId = data?.id as string | undefined;
  }
  const routing = await resolveNumberRouting(supabase, userId, numberId);
  return routing.recording_enabled;
}
