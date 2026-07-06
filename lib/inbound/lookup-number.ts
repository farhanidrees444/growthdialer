import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, normalizeE164, phoneDigits } from '@/lib/inbound/phone';

export interface OwnedNumberRow {
  user_id: string;
  phone_number: string;
  status?: string;
  workspace_id?: string | null;
}

function digitsMatch(a: string, b: string): boolean {
  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const last10a = da.length >= 10 ? da.slice(-10) : da;
  const last10b = db.length >= 10 ? db.slice(-10) : db;
  return last10a.length >= 10 && last10a === last10b;
}

/**
 * Primary inbound DID lookup — uses purchased_numbers.user_id (not workspace_id).
 * SELECT user_id FROM purchased_numbers WHERE phone_number = E.164
 */
export async function findPurchasedNumberOwner(
  supabase: SupabaseClient,
  toE164: string,
): Promise<{
  id: string;
  user_id: string;
  phone_number: string;
  telnyx_number_id: string | null;
} | null> {
  const normalized = normalizeE164(toE164);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('purchased_numbers')
    .select('id, user_id, phone_number, telnyx_number_id')
    .eq('phone_number', normalized)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[INBOUND] purchased_numbers lookup failed:', error.message, { to: normalized });
  }
  if (data?.user_id) return data;

  for (const variant of buildPhoneVariants(normalized)) {
    if (variant === normalized) continue;
    const { data: alt } = await supabase
      .from('purchased_numbers')
      .select('id, user_id, phone_number, telnyx_number_id')
      .eq('phone_number', variant)
      .limit(1)
      .maybeSingle();
    if (alt?.user_id) return alt;
  }

  return null;
}

/**
 * Resolve the owner of a DID using E.164 normalization and legacy stored formats.
 */
export async function findNumberOwner(
  supabase: SupabaseClient,
  toE164: string,
): Promise<OwnedNumberRow | null> {
  const row = await findPurchasedNumberOwner(supabase, toE164);
  if (row) {
    return {
      user_id: row.user_id,
      phone_number: row.phone_number,
    };
  }

  const normalized = normalizeE164(toE164);
  const targetDigits = phoneDigits(normalized);
  const last10 = targetDigits.length >= 10 ? targetDigits.slice(-10) : null;

  if (last10) {
    const { data: candidates } = await supabase
      .from('purchased_numbers')
      .select('user_id, phone_number')
      .or(`phone_number.ilike.%${last10}%,phone_number.ilike.%${targetDigits}%`)
      .limit(30);

    for (const candidate of candidates ?? []) {
      if (digitsMatch(candidate.phone_number ?? '', normalized)) {
        return candidate as OwnedNumberRow;
      }
    }
  }

  return null;
}

export async function findNumberOwnerWithMeta(
  supabase: SupabaseClient,
  toE164: string,
): Promise<(OwnedNumberRow & { id?: string; telnyx_number_id?: string | null }) | null> {
  const direct = await findPurchasedNumberOwner(supabase, toE164);
  if (direct) return direct;

  const owner = await findNumberOwner(supabase, toE164);
  return owner;
}
