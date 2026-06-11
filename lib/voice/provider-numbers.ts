import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPhoneVariants, normalizeE164 } from '@/lib/inbound/phone';
import { assignNumberToVoiceConnection } from '@/lib/voice/assign-number-connection';
import { readVoiceApiKey } from '@/lib/voice/read-env';
import {
  getCachedPhoneIndex,
  setCachedPhoneIndex,
} from '@/lib/voice/voice-api-cache';

const VOICE_API = 'https://api.telnyx.com/v2';

export interface ProviderPhoneRecord {
  id: string;
  phone_number: string;
  connection_id: string | null;
}

export function normalizeConnectionId(id: string | number | null | undefined): string | null {
  if (id == null || id === '') return null;
  return String(id).trim();
}

export function connectionsMatch(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  const left = normalizeConnectionId(a);
  const right = normalizeConnectionId(b);
  return Boolean(left && right && left === right);
}

/** Fetch all account phone numbers once (paginated). */
export async function fetchProviderPhoneIndex(): Promise<Map<string, ProviderPhoneRecord>> {
  const cached = getCachedPhoneIndex();
  if (cached) return cached;

  const apiKey = readVoiceApiKey();
  const index = new Map<string, ProviderPhoneRecord>();
  if (!apiKey) return index;

  let page = 1;
  const pageSize = 250;

  try {
    for (;;) {
      const res = await fetch(
        `${VOICE_API}/phone_numbers?page[number]=${page}&page[size]=${pageSize}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      if (!res.ok) break;

      const json = await res.json() as {
        data?: Array<{ id?: string; phone_number?: string; connection_id?: string | number | null }>;
        meta?: { total_pages?: number };
      };

      for (const row of json.data ?? []) {
        if (!row.id || !row.phone_number) continue;
        const record: ProviderPhoneRecord = {
          id: row.id,
          phone_number: row.phone_number,
          connection_id: normalizeConnectionId(row.connection_id),
        };
        for (const variant of buildPhoneVariants(normalizeE164(row.phone_number))) {
          index.set(variant, record);
        }
      }

      const totalPages = json.meta?.total_pages ?? 1;
      if (page >= totalPages) break;
      page++;
    }
  } catch (err) {
    console.error('[VOICE] provider phone index failed:', err);
  }

  if (index.size > 0) setCachedPhoneIndex(index);
  return index;
}

export function lookupProviderPhone(
  index: Map<string, ProviderPhoneRecord>,
  phone: string,
): ProviderPhoneRecord | null {
  for (const variant of buildPhoneVariants(normalizeE164(phone))) {
    const hit = index.get(variant);
    if (hit) return hit;
  }
  return null;
}

export interface DbNumberRow {
  id: string;
  phone_number: string;
  telnyx_number_id: string | null;
  is_default?: boolean;
}

export interface RoutingAudit {
  total: number;
  routed: number;
  unrouted: number;
  primary_routed: boolean;
  needs_activation: boolean;
  unrouted_phones: string[];
}

export async function auditNumberRouting(
  numbers: DbNumberRow[],
  connectionId: string | null,
  providerIndex: Map<string, ProviderPhoneRecord>,
): Promise<RoutingAudit> {
  const targetConnection = normalizeConnectionId(connectionId);
  let routed = 0;
  let unrouted = 0;
  const unroutedPhones: string[] = [];
  let primaryRouted = false;

  for (const num of numbers) {
    const provider = lookupProviderPhone(providerIndex, num.phone_number);
    const providerId = num.telnyx_number_id ?? provider?.id ?? null;
    const onConnection = provider
      ? connectionsMatch(provider.connection_id, targetConnection)
      : false;

    if (providerId && onConnection) {
      routed++;
      if (num.is_default) primaryRouted = true;
    } else {
      unrouted++;
      unroutedPhones.push(num.phone_number);
    }
  }

  if (!primaryRouted && numbers.length > 0) {
    const primary = numbers.find((n) => n.is_default) ?? numbers[0];
    const provider = lookupProviderPhone(providerIndex, primary.phone_number);
    primaryRouted = Boolean(
      provider && connectionsMatch(provider.connection_id, targetConnection),
    );
  }

  return {
    total: numbers.length,
    routed,
    unrouted,
    primary_routed: primaryRouted,
    needs_activation: unrouted > 0,
    unrouted_phones: unroutedPhones,
  };
}

/** Backfill missing provider IDs in DB from live provider index. */
export async function backfillProviderIds(
  supabase: SupabaseClient,
  numbers: DbNumberRow[],
  providerIndex: Map<string, ProviderPhoneRecord>,
): Promise<void> {
  await Promise.all(
    numbers.map(async (num) => {
      if (num.telnyx_number_id) return;
      const provider = lookupProviderPhone(providerIndex, num.phone_number);
      if (!provider?.id) return;
      await supabase
        .from('purchased_numbers')
        .update({ telnyx_number_id: provider.id })
        .eq('id', num.id);
      num.telnyx_number_id = provider.id;
    }),
  );
}

export interface ActivateRoutingResult {
  activated: number;
  already_routed: number;
  failed: number;
  results: { phone: string; status: 'activated' | 'already' | 'failed' | 'skipped' }[];
}

/** Assign every purchased number to the active voice connection (growthdialer-sip). */
export async function forceAssignAllNumbersToConnection(
  numbers: DbNumberRow[],
  connectionId: string,
  providerIndex: Map<string, ProviderPhoneRecord>,
): Promise<ActivateRoutingResult> {
  const target = normalizeConnectionId(connectionId)!;
  let activated = 0;
  let already_routed = 0;
  let failed = 0;
  const results: ActivateRoutingResult['results'] = [];

  for (const num of numbers) {
    const provider = lookupProviderPhone(providerIndex, num.phone_number);
    const providerId = num.telnyx_number_id ?? provider?.id ?? null;

    if (!providerId) {
      failed++;
      results.push({ phone: num.phone_number, status: 'skipped' });
      continue;
    }

    if (provider && connectionsMatch(provider.connection_id, target)) {
      already_routed++;
      results.push({ phone: num.phone_number, status: 'already' });
      continue;
    }

    const ok = await assignNumberToVoiceConnection(providerId);
    if (ok) {
      activated++;
      results.push({ phone: num.phone_number, status: 'activated' });
      if (provider) provider.connection_id = target;
    } else {
      failed++;
      results.push({ phone: num.phone_number, status: 'failed' });
    }
  }

  return { activated, already_routed, failed, results };
}

export async function activateRoutingForNumbers(
  numbers: DbNumberRow[],
  connectionId: string,
  providerIndex: Map<string, ProviderPhoneRecord>,
): Promise<ActivateRoutingResult> {
  const target = normalizeConnectionId(connectionId)!;
  let activated = 0;
  let already_routed = 0;
  let failed = 0;
  const results: ActivateRoutingResult['results'] = [];

  for (const num of numbers) {
    const provider = lookupProviderPhone(providerIndex, num.phone_number);
    const providerId = num.telnyx_number_id ?? provider?.id ?? null;

    if (!providerId) {
      failed++;
      results.push({ phone: num.phone_number, status: 'skipped' });
      continue;
    }

    if (provider && connectionsMatch(provider.connection_id, target)) {
      already_routed++;
      results.push({ phone: num.phone_number, status: 'already' });
      continue;
    }

    const ok = await assignNumberToVoiceConnection(providerId);
    if (ok) {
      activated++;
      results.push({ phone: num.phone_number, status: 'activated' });
      if (provider) provider.connection_id = target;
    } else {
      failed++;
      results.push({ phone: num.phone_number, status: 'failed' });
    }
  }

  return { activated, already_routed, failed, results };
}

export function resolveAppUrlFromRequest(request: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return '';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}
