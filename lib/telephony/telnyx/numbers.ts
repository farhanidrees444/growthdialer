import { readCallControlAppId, readVoiceApiKey } from '@/lib/voice/read-env';
import { normalizeE164 } from '@/lib/inbound/phone';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import {
  fetchProviderPhoneIndex,
  type ProviderPhoneRecord,
} from '@/lib/voice/provider-numbers';

const VOICE_API = 'https://api.telnyx.com/v2';

export interface AvailableTelephonyNumber {
  phoneNumber: string;
  type: string;
  city: string;
  state: string;
  monthlyCost: number;
  currency: string;
}

export async function searchAvailableTelephonyNumbers(input: {
  country?: string;
  areaCode?: string;
  type?: string;
  limit?: number;
}): Promise<AvailableTelephonyNumber[]> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return [];

  const country = (input.country ?? 'US').toUpperCase();
  const isTollFree = input.type === 'toll_free';
  const limit = Math.min(input.limit ?? 12, 30);

  const params = new URLSearchParams();
  params.set('filter[country_code]', country);
  params.set('filter[phone_number_type]', isTollFree ? 'toll_free' : 'local');
  params.set('filter[limit]', String(limit));
  if (!isTollFree && input.areaCode?.length === 3) {
    params.set('filter[national_destination_code]', input.areaCode);
  }
  if (isTollFree) {
    params.set('filter[quickship]', 'true');
  }

  try {
    const res = await fetch(`${VOICE_API}/available_phone_numbers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.error('[telephony/numbers] search failed:', res.status, (await res.text()).slice(0, 300));
      return [];
    }

    const json = await res.json() as {
      data?: Array<{
        phone_number?: string;
        region_information?: Array<{ region_type?: string; region_name?: string }>;
        cost_information?: { upfront_cost?: string; monthly_cost?: string };
      }>;
    };

    const wholesale = isTollFree ? 2.0 : 1.15;

    return (json.data ?? [])
      .filter((n): n is typeof n & { phone_number: string } => Boolean(n.phone_number))
      .map((n) => {
        const region = n.region_information ?? [];
        const city = region.find((r) => r.region_type === 'rate_center')?.region_name ?? '';
        const state = region.find((r) => r.region_type === 'state')?.region_name ?? '';
        return {
          phoneNumber: n.phone_number,
          type: isTollFree ? 'toll_free' : 'local',
          city,
          state,
          monthlyCost: calculateRetailPrice(
            Number(n.cost_information?.monthly_cost ?? wholesale) || wholesale,
          ),
          currency: 'USD',
        };
      });
  } catch (err) {
    console.error('[telephony/numbers] search exception:', err);
    return [];
  }
}

export interface TelephonyNumberPurchaseResult {
  phoneNumber: string;
  providerId: string;
  connectionAssigned: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Order a number and confirm — not just request — that it is assigned to
 * our Call Control application before returning success. A number with no
 * Connection has no inbound routing and no outbound permissions, so this
 * assertion is load-bearing, not cosmetic (Part 9).
 */
export async function purchaseTelephonyNumber(input: {
  phoneNumber: string;
}): Promise<TelephonyNumberPurchaseResult | null> {
  const apiKey = readVoiceApiKey();
  const connectionId = readCallControlAppId();
  const e164 = normalizeE164(input.phoneNumber);
  if (!apiKey || !connectionId || !e164) return null;

  try {
    const orderRes = await telephonyRequest<{
      data?: { id?: string; status?: string };
    }>('/number_orders', {
      method: 'POST',
      body: JSON.stringify({
        phone_numbers: [{ phone_number: e164 }],
        connection_id: connectionId,
      }),
    });

    const orderId = orderRes.data?.id;
    if (!orderId) return null;

    // Local/quickship toll-free numbers activate near-instantly; poll briefly
    // rather than trusting a single snapshot.
    let providerId: string | null = null;
    let connectionAssigned = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await sleep(attempt === 0 ? 800 : 1500);
      const index = await refreshedPhoneIndex();
      const record = lookupByNumber(index, e164);
      if (record) {
        providerId = record.id;
        connectionAssigned = record.connection_id === connectionId;
        if (connectionAssigned) break;
      }
    }

    if (!providerId) {
      console.error('[telephony/numbers] purchase completed but number not found in inventory:', e164);
      return null;
    }

    if (!connectionAssigned) {
      // Fail loudly rather than silently — retry the assignment once,
      // explicitly, before giving up (Part 9 hard requirement).
      const retried = await assignNumberConnection(providerId, connectionId);
      connectionAssigned = retried;
      if (!retried) {
        console.error(
          '[telephony/numbers] number purchased but Connection assignment FAILED — inbound/outbound will not work:',
          e164,
          providerId,
        );
      }
    }

    return { phoneNumber: e164, providerId, connectionAssigned };
  } catch (err) {
    console.error('[telephony/numbers] purchase exception:', err);
    return null;
  }
}

async function refreshedPhoneIndex(): Promise<Map<string, ProviderPhoneRecord>> {
  // Bypass the module-level cache — we need a fresh read right after ordering.
  const apiKey = readVoiceApiKey();
  const index = new Map<string, ProviderPhoneRecord>();
  if (!apiKey) return index;
  try {
    const res = await fetch(`${VOICE_API}/phone_numbers?page[size]=250`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return index;
    const json = await res.json() as {
      data?: Array<{ id?: string; phone_number?: string; connection_id?: string | number | null }>;
    };
    for (const row of json.data ?? []) {
      if (!row.id || !row.phone_number) continue;
      const normalized = normalizeE164(row.phone_number) ?? row.phone_number;
      index.set(normalized, {
        id: row.id,
        phone_number: row.phone_number,
        connection_id: row.connection_id != null ? String(row.connection_id) : null,
      });
    }
  } catch (err) {
    console.error('[telephony/numbers] phone index refresh failed:', err);
  }
  return index;
}

function lookupByNumber(
  index: Map<string, ProviderPhoneRecord>,
  phone: string,
): ProviderPhoneRecord | null {
  return index.get(phone) ?? null;
}

async function assignNumberConnection(providerId: string, connectionId: string): Promise<boolean> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${VOICE_API}/phone_numbers/${providerId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection_id: connectionId }),
    });
    return res.ok;
  } catch (err) {
    console.error('[telephony/numbers] connection assign exception:', err);
    return false;
  }
}

export async function releaseTelephonyNumber(providerId: string): Promise<boolean> {
  const apiKey = readVoiceApiKey();
  if (!apiKey || !providerId) return false;
  try {
    const res = await fetch(`${VOICE_API}/phone_numbers/${providerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 404) return true;
    return res.ok;
  } catch (err) {
    console.error('[telephony/numbers] release exception:', err);
    return false;
  }
}

export interface TelephonySyncResult {
  synced: number;
  skipped: number;
  total: number;
  message: string;
}

/**
 * Reconcile numbers that exist on the Telnyx account but are missing from
 * `purchased_numbers` (e.g. bought directly in the Telnyx portal). Unlike
 * the old Twilio friendly-name tagging trick, ownership here is DB-driven:
 * numbers already claimed by another workspace are never touched.
 */
export async function syncTelephonyNumbersForUser(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  workspaceId: string | null,
  options?: { claimOrphans?: boolean },
): Promise<TelephonySyncResult> {
  const connectionId = readCallControlAppId();
  const providerIndex = await fetchProviderPhoneIndex();
  if (providerIndex.size === 0) {
    return { synced: 0, skipped: 0, total: 0, message: 'No numbers found on this voice account.' };
  }

  const claimOrphans = options?.claimOrphans ?? false;
  let synced = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const record of providerIndex.values()) {
    const phoneNumber = normalizeE164(record.phone_number) ?? record.phone_number;
    if (seen.has(phoneNumber)) continue;
    seen.add(phoneNumber);

    const { data: existing } = await supabase
      .from('purchased_numbers')
      .select('id, user_id')
      .eq('phone_number', phoneNumber)
      .neq('status', 'released')
      .maybeSingle();

    if (existing?.user_id && existing.user_id !== userId) {
      skipped += 1;
      continue;
    }
    if (existing?.user_id === userId) {
      continue; // already linked, nothing to do
    }
    if (!claimOrphans) {
      skipped += 1;
      continue;
    }

    if (connectionId && record.connection_id !== connectionId) {
      await assignNumberConnection(record.id, connectionId);
    }

    const { count } = await supabase
      .from('purchased_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'released');

    const wholesale = phoneNumber.startsWith('+1800') || phoneNumber.startsWith('+1888') ? 2.0 : 1.15;
    const { error } = await supabase.from('purchased_numbers').insert({
      user_id: userId,
      workspace_id: workspaceId,
      phone_number: phoneNumber,
      telnyx_number_id: record.id,
      country: 'US',
      number_type: phoneNumber.startsWith('+1800') || phoneNumber.startsWith('+1888') ? 'toll_free' : 'local',
      status: 'active',
      is_default: (count ?? 0) === 0,
      monthly_cost: calculateRetailPrice(wholesale),
      billing_status: 'active',
      auto_renew: true,
      purchased_at: new Date().toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!error) synced += 1;
    else skipped += 1;
  }

  const message =
    synced > 0
      ? `Linked ${synced} number${synced !== 1 ? 's' : ''} to your account`
      : skipped > 0
        ? `${skipped} line${skipped !== 1 ? 's' : ''} on this voice account could not be linked.`
        : 'No unclaimed numbers found. Buy a number to get started.';

  return { synced, skipped, total: providerIndex.size, message };
}
