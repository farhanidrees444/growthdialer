import { normalizeInboundCallerId } from '@/lib/inbound/phone';

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

/** Caller ID from Telnyx inbound webhook — field order per Telnyx payload variants. */
export function extractInboundCallerNumber(root: Record<string, unknown>): string | null {
  const inner = readTelnyxInnerPayload(root);
  const data = root.data as Record<string, unknown> | undefined;
  const candidates = [
    inner.from,
    inner.caller_id_number,
    inner.from_number,
    data?.from,
    root.from,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const normalized = normalizeInboundCallerId(raw) ?? (raw.trim() || null);
    if (normalized) return normalized;
  }
  return null;
}
