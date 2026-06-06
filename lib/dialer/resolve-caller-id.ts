import type { SupabaseClient } from '@supabase/supabase-js';
import { getBestCallerNumber } from '@/lib/utils/local-presence';

interface PurchasedNumberRow {
  phone_number: string;
  is_default: boolean;
}

/**
 * Resolve outbound caller ID for a lead — local presence when numbers exist.
 */
export async function resolveCallerIdForLead(
  supabase: SupabaseClient,
  userId: string,
  leadPhone?: string | null,
): Promise<{ fromNumber: string; matchLabel: string }> {
  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('phone_number, is_default')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: false });

  const active = (numbers ?? []) as PurchasedNumberRow[];

  if (leadPhone && active.length > 1) {
    const presence = getBestCallerNumber(
      leadPhone,
      active.map((n, i) => ({ id: String(i), phone_number: n.phone_number, is_default: n.is_default })),
    );
    if (presence.number) {
      return { fromNumber: presence.number, matchLabel: presence.matchLabel };
    }
  }

  if (active[0]?.phone_number) {
    return { fromNumber: active[0].phone_number, matchLabel: active[0].is_default ? 'Default' : 'Active number' };
  }

  return {
    fromNumber: process.env.TELNYX_FROM_NUMBER ?? '',
    matchLabel: 'System',
  };
}
