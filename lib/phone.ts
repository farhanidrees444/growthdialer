import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Normalize a raw phone string to E.164, using defaultCountry as context.
 * Returns null if the number cannot be parsed into a valid E.164 number.
 *
 * Special case: if defaultCountry is non-US/CA and the raw value starts with
 * "+1" followed by digits that are NOT a valid NANP number, we strip the
 * "+1" prefix and re-parse under defaultCountry. This fixes the common CRM
 * export bug where UK/AU numbers get a spurious "+1" prepended.
 */
export function normalizePhone(raw: string, defaultCountry: CountryCode = 'US'): string | null {
  if (!raw || !raw.trim()) return null;

  const cleaned = raw.replace(/[^\d+]/g, '').trim();
  if (!cleaned) return null;

  // First attempt: parse as-is with the given country hint
  let parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
  if (parsed?.isValid()) return parsed.format('E.164');

  // Second attempt: if non-NANP country and number starts with "+1", strip
  // that prefix and re-parse — fixes "+11942864600" → "+441942864600" (UK)
  if (defaultCountry !== 'US' && defaultCountry !== 'CA' && cleaned.startsWith('+1')) {
    const stripped = cleaned.slice(2); // remove "+1"
    parsed = parsePhoneNumberFromString(stripped, defaultCountry);
    if (parsed?.isValid()) return parsed.format('E.164');
  }

  // Third attempt: CRM export bug — international numbers prefixed with spurious +1
  // while import defaultCountry is US (e.g. UK "+11342833034" → "+441342833034")
  if ((defaultCountry === 'US' || defaultCountry === 'CA') && cleaned.startsWith('+1')) {
    const stripped = cleaned.slice(2);
    const intlFallbacks: CountryCode[] = ['GB', 'AU', 'IE', 'NZ', 'DE', 'FR'];
    for (const cc of intlFallbacks) {
      parsed = parsePhoneNumberFromString(stripped, cc)
        ?? parsePhoneNumberFromString(stripped.replace(/^0+/, ''), cc);
      if (parsed?.isValid()) return parsed.format('E.164');
    }
  }

  // Fallback for plain 10-digit US numbers not caught above
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10 && (defaultCountry === 'US' || defaultCountry === 'CA')) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1') && (defaultCountry === 'US' || defaultCountry === 'CA')) {
    return `+${digits}`;
  }

  return null;
}

export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/** Last-resort E.164 shaping when strict normalization fails. */
export function bestEffortE164(raw: string): string | null {
  const normalized = normalizePhone(raw) ?? (isE164(raw) ? raw : null);
  if (normalized) return normalized;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
