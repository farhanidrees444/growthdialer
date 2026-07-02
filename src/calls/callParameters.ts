import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';

export function readCallParameter(call: VoiceSdkCall, key: string): string | null {
  const direct = call.parameters?.[key]?.trim();
  if (direct) return direct;
  try {
    return call.customParameters?.get(key)?.trim() || null;
  } catch {
    return null;
  }
}
