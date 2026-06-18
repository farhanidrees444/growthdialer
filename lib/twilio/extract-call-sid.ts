import type { Call } from '@twilio/voice-sdk';

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
