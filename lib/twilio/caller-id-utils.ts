import { isValidCallerPhone } from '@/lib/inbound/phone';

const ANONYMOUS_VALUES = new Set(['anonymous', 'restricted', 'unknown', 'private', 'unavailable']);

export function isAnonymousCaller(from: string | null | undefined): boolean {
  if (!from?.trim()) return true;
  const lower = from.trim().toLowerCase();
  if (ANONYMOUS_VALUES.has(lower)) return true;
  return !isValidCallerPhone(from);
}
