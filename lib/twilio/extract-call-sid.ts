import type { Call } from '@twilio/voice-sdk';
import { isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';

const TWILIO_SID_RE = /^CA[a-f0-9]{32}$/i;

export function isTwilioCallSid(value: string | null | undefined): value is string {
  return Boolean(value && TWILIO_SID_RE.test(value.trim()));
}

/** Read Twilio CallSid from Voice SDK Call (parameters or internal field). */
export function extractCallSidFromSdkCall(call: Call): string | null {
  const fromParams = call.parameters?.CallSid?.trim();
  if (isTwilioCallSid(fromParams)) return fromParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = (call as any)._callSid as string | undefined;
  if (isTwilioCallSid(internal)) return internal;

  return null;
}

function readCallParam(call: Call, ...keys: string[]): string | null {
  const params = call.parameters ?? {};
  for (const key of keys) {
    const value = params[key]?.trim();
    if (value) return value;
  }
  try {
    const custom = call.customParameters;
    if (custom?.get) {
      for (const key of keys) {
        const value = custom.get(key)?.trim();
        if (value) return value;
      }
    }
  } catch {
    /* customParameters may be unavailable */
  }
  return null;
}

/** PSTN caller ID from an inbound Twilio Client call, when present. */
export function extractInboundFromNumber(call: Call): string | null {
  const fromTwiml = readCallParam(call, 'gd_from_number');
  if (fromTwiml && isValidCallerPhone(fromTwiml)) return normalizeE164(fromTwiml);

  const raw = readCallParam(call, 'From', 'from', 'Caller', 'caller');
  if (!raw || !isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

/** Called line (agent DID) from an inbound Twilio Client call. */
export function extractInboundToNumber(call: Call): string | null {
  const toTwiml = readCallParam(call, 'gd_to_number');
  if (toTwiml && isValidCallerPhone(toTwiml)) return normalizeE164(toTwiml);

  const raw = readCallParam(call, 'To', 'to', 'Called', 'called');
  if (!raw) return null;
  if (raw.toLowerCase().startsWith('client:')) return null;
  if (!isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

export function isTwilioCallOpen(call: Call): boolean {
  return call.status() === 'open';
}
