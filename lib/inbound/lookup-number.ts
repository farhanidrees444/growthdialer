import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, normalizeE164, phoneDigits } from '@/lib/inbound/phone';

export interface OwnedNumberRow {
  user_id: string;
  phone_number: string;
  status: string;
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
 * Resolve the owner of a DID using E.164 normalization and legacy stored formats.
 */
export async function findNumberOwner(
  supabase: SupabaseClient,
  toE164: string,
): Promise<OwnedNumberRow | null> {
  const normalized = normalizeE164(toE164);
  const variants = buildPhoneVariants(normalized);
  if (variants.length === 0) return null;

  const { data: exact } = await supabase
    .from('purchased_numbers')
    .select('user_id, phone_number, status, workspace_id')
    .in('phone_number', variants)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  if (exact) return exact as OwnedNumberRow;

  const targetDigits = phoneDigits(normalized);
  const last10 = targetDigits.length >= 10 ? targetDigits.slice(-10) : null;

  if (last10) {
    const { data: candidates } = await supabase
      .from('purchased_numbers')
      .select('user_id, phone_number, status, workspace_id')
      .neq('status', 'released')
      .or(`phone_number.ilike.%${last10}%,phone_number.ilike.%${targetDigits}%`)
      .limit(30);

    for (const row of candidates ?? []) {
      if (digitsMatch(row.phone_number ?? '', normalized)) {
        return row as OwnedNumberRow;
      }
    }
  }

  return null;
}

export async function findNumberOwnerWithMeta(
  supabase: SupabaseClient,
  toE164: string,
): Promise<(OwnedNumberRow & { id?: string; telnyx_number_id?: string | null }) | null> {
  const normalized = normalizeE164(toE164);
  const variants = buildPhoneVariants(normalized);
  if (variants.length === 0) return null;

  const { data: exact } = await supabase
    .from('purchased_numbers')
    .select('id, user_id, phone_number, status, workspace_id, telnyx_number_id')
    .in('phone_number', variants)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  if (exact) return exact as OwnedNumberRow & { id?: string; telnyx_number_id?: string | null };

  const targetDigits = phoneDigits(normalized);
  const last10 = targetDigits.length >= 10 ? targetDigits.slice(-10) : null;

  if (last10) {
    const { data: candidates } = await supabase
      .from('purchased_numbers')
      .select('id, user_id, phone_number, status, workspace_id, telnyx_number_id')
      .neq('status', 'released')
      .or(`phone_number.ilike.%${last10}%,phone_number.ilike.%${targetDigits}%`)
      .limit(30);

    for (const row of candidates ?? []) {
      if (digitsMatch(row.phone_number ?? '', normalized)) {
        return row as OwnedNumberRow & { id?: string; telnyx_number_id?: string | null };
      }
    }
  }

  return null;
}
