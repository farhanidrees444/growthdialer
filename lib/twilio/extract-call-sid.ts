import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';
import { isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';

const TWILIO_SID_RE = /^CA[a-f0-9]{32}$/i;
const TELNYX_CONTROL_RE = /^v\d:/;

export function isTwilioCallSid(value: string | null | undefined): value is string {
  return Boolean(value && TWILIO_SID_RE.test(value.trim()));
}

export function isTelnyxCallControlId(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return TELNYX_CONTROL_RE.test(trimmed) || trimmed.length >= 20;
}

/** Read provider call id from the browser voice SDK call object. */
export function extractCallSidFromSdkCall(call: VoiceSdkCall): string | null {
  const fromParams = call.parameters?.CallSid?.trim();
  if (fromParams && (isTwilioCallSid(fromParams) || isTelnyxCallControlId(fromParams))) {
    return fromParams;
  }

  const ids = call.telnyxIDs;
  if (isTelnyxCallControlId(ids.telnyxCallControlId)) return ids.telnyxCallControlId;
  if (call.id) return call.id;

  return null;
}

function readCallParam(call: VoiceSdkCall, ...keys: string[]): string | null {
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

/** PSTN caller ID from an inbound browser call, when present. */
export function extractInboundFromNumber(call: VoiceSdkCall): string | null {
  const fromTwiml = readCallParam(call, 'gd_from_number');
  if (fromTwiml && isValidCallerPhone(fromTwiml)) return normalizeE164(fromTwiml);

  const raw = readCallParam(call, 'From', 'from', 'Caller', 'caller');
  if (!raw || !isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

/** Called line (agent DID) from an inbound browser call. */
export function extractInboundToNumber(call: VoiceSdkCall): string | null {
  const toTwiml = readCallParam(call, 'gd_to_number');
  if (toTwiml && isValidCallerPhone(toTwiml)) return normalizeE164(toTwiml);

  const raw = readCallParam(call, 'To', 'to', 'Called', 'called');
  if (!raw) return null;
  if (raw.toLowerCase().startsWith('client:')) return null;
  if (!isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

export function isTwilioCallOpen(call: VoiceSdkCall): boolean {
  return call.status() === 'open';
}
