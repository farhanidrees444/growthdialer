import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, isValidCallerPhone, normalizeE164, phoneDigits } from '@/lib/inbound/phone';

export interface MatchedLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

/**
 * Match an inbound caller ANI to a lead by phone (E.164 + common format variants).
 */
export async function findLeadByCallerPhone(
  supabase: SupabaseClient,
  userId: string,
  callerE164: string,
  options?: { excludeNumbers?: string[] },
): Promise<MatchedLead | null> {
  if (!isValidCallerPhone(callerE164)) return null;

  const normalizedCaller = normalizeE164(callerE164);
  const exclude = new Set(
    (options?.excludeNumbers ?? []).flatMap((n) => buildPhoneVariants(normalizeE164(n))),
  );
  const callerVariants = buildPhoneVariants(normalizedCaller);
  if (callerVariants.some((v) => exclude.has(v))) {
    return null;
  }

  const variants = callerVariants;
  if (variants.length === 0) return null;

  const { data: exact } = await supabase
    .from('leads')
    .select('id, first_name, last_name, company, phone')
    .eq('user_id', userId)
    .in('phone', variants)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (exact) {
    return {
      id: exact.id,
      first_name: exact.first_name,
      last_name: exact.last_name,
      company: exact.company,
    };
  }

  const callerDigits = phoneDigits(normalizedCaller);
  const last10 = callerDigits.length >= 10 ? callerDigits.slice(-10) : null;
  if (!last10) return null;

  const { data: candidates } = await supabase
    .from('leads')
    .select('id, first_name, last_name, company, phone')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .like('phone', `%${last10}`)
    .limit(10);

  for (const lead of candidates ?? []) {
    const leadDigits = phoneDigits(lead.phone ?? '');
    if (!leadDigits) continue;
    if (leadDigits === callerDigits) return lead;
    if (leadDigits.slice(-10) === last10) return lead;
  }

  return null;
}
