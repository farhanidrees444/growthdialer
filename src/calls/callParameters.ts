import type { Call } from '@twilio/voice-sdk';

export function readCallParameter(call: Call, key: string): string | null {
  const direct = call.parameters?.[key]?.trim();
  if (direct) return direct;
  try {
    return call.customParameters?.get(key)?.trim() || null;
  } catch {
    return null;
  }
}
