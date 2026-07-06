/** Normalize a raw phone string to E.164 (+digits only). */
export function normalizeE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits ? `+${digits}` : raw.trim();
}

/** True when the value looks like a dialable PSTN caller ID (not SIP/anonymous). */
export function isValidCallerPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('anonymous') || trimmed.includes('@') || lower.startsWith('sip:')) {
    return false;
  }
  const digits = phoneDigits(trimmed);
  return digits.length >= 10;
}

/** Inbound PSTN caller ID — null when blocked, private, or non-numeric. */
export function normalizeInboundCallerId(raw: string): string | null {
  if (!isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

/** Human label for inbound overlay when caller ID is missing or blocked. */
export function formatInboundCallerDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return 'Unknown / Blocked';
  const trimmed = raw.trim();
  if (/^restricted@/i.test(trimmed) || /^anonymous@/i.test(trimmed) || /^private@/i.test(trimmed)) {
    return 'Restricted / Private';
  }
  if (trimmed.includes('@') && !isValidCallerPhone(trimmed)) {
    const user = trimmed.split('@')[0];
    return user ? `${user} (blocked ID)` : 'Unknown / Blocked';
  }
  if (!isValidCallerPhone(trimmed)) return 'Unknown / Blocked';
  const m = normalizeE164(trimmed).match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return normalizeE164(trimmed);
}

/** Strip to digits for fuzzy comparison. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Common stored formats for the same NANP / E.164 number. */
export function buildPhoneVariants(e164: string): string[] {
  const digits = phoneDigits(e164);
  const set = new Set<string>();
  if (e164.trim()) set.add(e164.trim());
  if (digits) {
    set.add(`+${digits}`);
    set.add(digits);
    if (digits.length === 11 && digits.startsWith('1')) {
      set.add(`+1${digits.slice(1)}`);
      set.add(digits.slice(1));
    }
    if (digits.length === 10) {
      set.add(`+1${digits}`);
    }
  }
  return [...set];
}
