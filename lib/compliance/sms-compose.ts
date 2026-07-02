const MAX_SMS_CHARS = 1600;

export function normalizeSmsBody(body: string): string {
  return body.replace(/\r\n/g, '\n').trim();
}

export function assertSmsBodyLength(body: string): string | null {
  if (!body) return 'Message body is required';
  if (body.length > MAX_SMS_CHARS) {
    return `Message is too long (${body.length} chars). Maximum is ${MAX_SMS_CHARS}.`;
  }
  return null;
}

/** Append standard opt-out hint on first outbound message if missing. */
export function withComplianceFooter(body: string, includeFooter: boolean): string {
  if (!includeFooter) return body;
  const lower = body.toLowerCase();
  if (lower.includes('stop') || lower.includes('unsubscribe')) return body;
  return `${body}\n\nReply STOP to opt out.`;
}
