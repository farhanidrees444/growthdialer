/** Normalize a raw phone string to E.164 (+digits only). */
export function normalizeE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits ? `+${digits}` : raw.trim();
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
