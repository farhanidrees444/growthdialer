import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';
import { isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';

const LEGACY_TWILIO_SID_RE = /^CA[a-f0-9]{32}$/i;
const TELNYX_CONTROL_RE = /^v\d:/;

/** @deprecated Legacy Twilio CallSid detection only — voice is Telnyx. */
export function isTwilioCallSid(value: string | null | undefined): value is string {
  return Boolean(value && LEGACY_TWILIO_SID_RE.test(value.trim()));
}

export function isTelnyxCallControlId(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return TELNYX_CONTROL_RE.test(trimmed) || trimmed.length >= 20;
}

export function isProviderCallId(value: string | null | undefined): boolean {
  return isTwilioCallSid(value) || isTelnyxCallControlId(value);
}

/** Read provider call id from the browser voice SDK call object. */
export function extractCallSidFromSdkCall(call: VoiceSdkCall): string | null {
  const fromParams = call.parameters?.CallSid?.trim();
  if (fromParams && isProviderCallId(fromParams)) {
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

export function extractInboundFromNumber(call: VoiceSdkCall): string | null {
  const fromHeader = readCallParam(call, 'gd_from_number', 'X-GD-From-Number');
  if (fromHeader && isValidCallerPhone(fromHeader)) return normalizeE164(fromHeader);

  const raw = readCallParam(call, 'From', 'from', 'Caller', 'caller');
  if (!raw || !isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

export function extractInboundToNumber(call: VoiceSdkCall): string | null {
  const toHeader = readCallParam(call, 'gd_to_number', 'X-GD-To-Number');
  if (toHeader && isValidCallerPhone(toHeader)) return normalizeE164(toHeader);

  const raw = readCallParam(call, 'To', 'to', 'Called', 'called');
  if (!raw) return null;
  if (raw.toLowerCase().startsWith('client:')) return null;
  if (!isValidCallerPhone(raw)) return null;
  return normalizeE164(raw);
}

export function isVoiceCallOpen(call: VoiceSdkCall): boolean {
  return call.status() === 'open';
}
