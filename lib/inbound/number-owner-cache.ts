import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import {
  findNumberOwnerWithMeta,
  type OwnedNumberRow,
} from '@/lib/inbound/lookup-number';

const TTL_MS = 45_000;
const MAX_ENTRIES = 512;

interface CacheEntry {
  owner: (OwnedNumberRow & { id?: string; telnyx_number_id?: string | null }) | null;
  expiresAt: number;
}

const ownerCache = new Map<string, CacheEntry>();

function pruneCache(): void {
  if (ownerCache.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of ownerCache) {
    if (entry.expiresAt <= now) ownerCache.delete(key);
  }
  if (ownerCache.size > MAX_ENTRIES) {
    const drop = ownerCache.size - MAX_ENTRIES;
    let i = 0;
    for (const key of ownerCache.keys()) {
      ownerCache.delete(key);
      if (++i >= drop) break;
    }
  }
}

/**
 * Hot-path cache for inbound `call.initiated` routing — avoids repeated
 * purchased_numbers scans within the same webhook burst / ring window.
 */
export async function getCachedNumberOwner(
  supabase: SupabaseClient,
  toE164: string,
): Promise<(OwnedNumberRow & { id?: string; telnyx_number_id?: string | null }) | null> {
  const key = normalizeE164(toE164);
  const hit = ownerCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.owner;
  }

  const owner = await findNumberOwnerWithMeta(supabase, key);
  ownerCache.set(key, { owner, expiresAt: Date.now() + TTL_MS });
  pruneCache();
  return owner;
}

/** Invalidate after number purchase/release (optional hook from admin routes). */
export function invalidateNumberOwnerCache(phoneE164: string): void {
  ownerCache.delete(normalizeE164(phoneE164));
}
