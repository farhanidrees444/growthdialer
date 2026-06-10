import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, phoneDigits } from '@/lib/inbound/phone';

export interface OwnedNumberRow {
  user_id: string;
  phone_number: string;
  status: string;
}

/**
 * Resolve the owner of a DID using E.164 normalization and common stored formats.
 */
export async function findNumberOwner(
  supabase: SupabaseClient,
  toE164: string,
): Promise<OwnedNumberRow | null> {
  const variants = buildPhoneVariants(toE164);
  if (variants.length === 0) return null;

  const { data: exact } = await supabase
    .from('purchased_numbers')
    .select('user_id, phone_number, status')
    .in('phone_number', variants)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  if (exact) return exact as OwnedNumberRow;

  const targetDigits = phoneDigits(toE164);
  const last10 = targetDigits.length >= 10 ? targetDigits.slice(-10) : null;
  if (!last10) return null;

  const { data: candidates } = await supabase
    .from('purchased_numbers')
    .select('user_id, phone_number, status')
    .neq('status', 'released')
    .like('phone_number', `%${last10}`)
    .limit(20);

  for (const row of candidates ?? []) {
    const stored = phoneDigits(row.phone_number ?? '');
    if (!stored) continue;
    if (stored === targetDigits) return row as OwnedNumberRow;
    if (stored.slice(-10) === last10) return row as OwnedNumberRow;
  }

  return null;
}
