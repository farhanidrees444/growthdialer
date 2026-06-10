import { getLocalTime } from '@/lib/utils/timezone';
import type { DialerQueueConfig } from './queue-query';

/** Matches queue column: unknown/international numbers are not blocked. */
export function isLeadTimezoneSafeToCall(phone: string): boolean {
  const info = getLocalTime(phone);
  return !info.hasData || !info.isUnsafe;
}

export function filterTimezoneSafeLeads<T extends { phone: string }>(leads: T[]): T[] {
  return leads.filter((lead) => isLeadTimezoneSafeToCall(lead.phone));
}

export function requiresTimezonePostFilter(config: DialerQueueConfig = {}): boolean {
  return config.filters?.tzSafe === true;
}
