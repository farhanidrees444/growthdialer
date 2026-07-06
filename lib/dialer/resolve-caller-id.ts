import type { SupabaseClient } from '@supabase/supabase-js';
import { isNumberCallable } from '@/lib/numbers/billing-lifecycle';
import { getBestCallerNumber } from '@/lib/utils/local-presence';

interface PurchasedNumberRow {
  phone_number: string;
  is_default: boolean;
  status: string;
  next_billing_date?: string | null;
  stripe_subscription_id?: string | null;
}

export interface CallerNumberCache {
  numbers: PurchasedNumberRow[];
  fallback: string;
}

export async function prefetchUserCallerNumbers(
  supabase: SupabaseClient,
  userId: string,
): Promise<CallerNumberCache> {
  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('phone_number, is_default, status, next_billing_date, stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: false });

  const callable = (numbers ?? []).filter((row) =>
    isNumberCallable(row as PurchasedNumberRow),
  ) as PurchasedNumberRow[];

  return {
    numbers: callable,
    fallback: '',
  };
}

export function resolveCallerIdFromCache(
  cache: CallerNumberCache,
  leadPhone?: string | null,
): { fromNumber: string; matchLabel: string } {
  const active = cache.numbers;

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

  return { fromNumber: cache.fallback, matchLabel: 'System' };
}

/**
 * Resolve outbound caller ID for a lead — local presence when numbers exist.
 */
export async function resolveCallerIdForLead(
  supabase: SupabaseClient,
  userId: string,
  leadPhone?: string | null,
): Promise<{ fromNumber: string; matchLabel: string }> {
  const cache = await prefetchUserCallerNumbers(supabase, userId);
  return resolveCallerIdFromCache(cache, leadPhone);
}
