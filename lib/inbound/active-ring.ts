import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, normalizeE164 } from '@/lib/inbound/phone';
import { createServiceClient } from '@/lib/supabase/service';

export interface ActiveInboundRingRow {
  id: string;
  telnyx_session_id: string | null;
  telnyx_call_id: string | null;
  from_number: string | null;
  to_number: string | null;
  status: string;
  started_at: string | null;
  direction: string;
  user_id: string;
}

const RING_SELECT =
  'id, telnyx_session_id, telnyx_call_id, from_number, to_number, status, started_at, direction, user_id';

async function ownedNumberVariants(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('purchased_numbers')
    .select('phone_number')
    .eq('user_id', userId)
    .neq('status', 'released');

  const variants = new Set<string>();
  for (const row of data ?? []) {
    const raw = row.phone_number as string | undefined;
    if (!raw) continue;
    const e164 = normalizeE164(raw);
    if (e164) variants.add(e164);
    for (const v of buildPhoneVariants(e164 ?? raw)) {
      variants.add(v);
    }
  }
  return Array.from(variants);
}

async function findRingingInboundByDids(
  db: SupabaseClient,
  dids: string[],
): Promise<ActiveInboundRingRow | null> {
  const { data: byDid } = await db
    .from('calls')
    .select(RING_SELECT)
    .eq('direction', 'inbound')
    .eq('status', 'ringing')
    .in('to_number', dids)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (byDid as ActiveInboundRingRow | null) ?? null;
}

/**
 * Find the active inbound ring for a user — by assigned user_id OR by owned DID.
 * Re-aligns user_id to the number owner when a ringing row targets their line.
 *
 * DID lookup uses the service role when available so RLS cannot hide a ring that
 * was assigned to another workspace agent but targets this user's phone number.
 */
export async function findActiveInboundRingForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveInboundRingRow | null> {
  const { data: byUser } = await supabase
    .from('calls')
    .select(RING_SELECT)
    .eq('user_id', userId)
    .eq('direction', 'inbound')
    .eq('status', 'ringing')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUser?.id) return byUser as ActiveInboundRingRow;

  const dids = await ownedNumberVariants(supabase, userId);
  if (!dids.length) return null;

  const service = createServiceClient();
  const byDid = await findRingingInboundByDids(service ?? supabase, dids);
  if (!byDid?.id) return null;

  if (byDid.user_id !== userId) {
    const writer = service ?? supabase;
    await writer
      .from('calls')
      .update({ user_id: userId })
      .eq('id', byDid.id)
      .eq('status', 'ringing');
    console.log('[INBOUND-RING] realigned ringing call to number owner', {
      call_id: byDid.id,
      user_id: userId,
    });
    return { ...byDid, user_id: userId };
  }

  return byDid;
}
