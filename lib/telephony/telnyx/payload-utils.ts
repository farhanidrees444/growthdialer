import { normalizeE164, normalizeInboundCallerId } from '@/lib/inbound/phone';

export function readTelnyxInnerPayload(
  root: Record<string, unknown>,
): Record<string, unknown> {
  const data = root.data as Record<string, unknown> | undefined;
  const inner = data?.payload as Record<string, unknown> | undefined;
  return inner ?? data ?? root;
}

export function readTelnyxDirection(root: Record<string, unknown>): string {
  const inner = readTelnyxInnerPayload(root);
  const data = root.data as Record<string, unknown> | undefined;
  return String(inner.direction ?? data?.direction ?? '').toLowerCase();
}

/** Only explicit outbound legs get webhook fast-answer. */
export function isExplicitOutboundTelnyxPayload(root: Record<string, unknown>): boolean {
  const dir = readTelnyxDirection(root);
  return dir === 'outgoing' || dir === 'outbound';
}

export function isInboundTelnyxPayload(root: Record<string, unknown>): boolean {
  const dir = readTelnyxDirection(root);
  return dir === 'incoming' || dir === 'inbound';
}

function readPhoneFromTelnyxFromField(fromField: unknown): string | null {
  if (fromField && typeof fromField === 'object' && fromField !== null) {
    const phone = (fromField as { phone_number?: unknown }).phone_number;
    if (typeof phone === 'string' && phone.trim()) {
      return normalizeInboundCallerId(phone) ?? normalizeE164(phone);
    }
  }
  if (typeof fromField === 'string' && fromField.trim()) {
    return normalizeInboundCallerId(fromField) ?? fromField.trim();
  }
  return null;
}

/** Caller ID from Telnyx inbound webhook payload (string or nested from.phone_number). */
export function extractInboundCallerNumber(root: Record<string, unknown>): string | null {
  const inner = readTelnyxInnerPayload(root);

  const fromObject = readPhoneFromTelnyxFromField(inner.from);
  if (fromObject) return fromObject;

  const candidates = [
    inner.caller_id_number,
    inner.from_number,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const normalized = normalizeInboundCallerId(raw) ?? raw.trim();
    if (normalized) return normalized;
  }
  return null;
}

export function extractInboundCallerFromEventPayload(payload: Record<string, unknown>): string | null {
  const fromObject = readPhoneFromTelnyxFromField(payload.from);
  if (fromObject) return fromObject;

  const candidates = [payload.caller_id_number, payload.from_number];
  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const normalized = normalizeInboundCallerId(raw) ?? raw.trim();
    if (normalized) return normalized;
  }
  return null;
}
