/**
 * Compatibility shim — canonical server-side Telnyx env readers live in
 * lib/telephony/telnyx/env.ts. New code should import from there directly.
 *
 * The aliases below are behavior-identical to the canonical readers:
 * - readVoiceApiKey() === readTelephonyApiKey()  (TELNYX_API_KEY)
 * - readConfiguredConnectionId() === readConnectionId()  (TELNYX_CONNECTION_ID)
 */
export { readEnv, readCallControlAppId } from '@/lib/telephony/telnyx/env';
import {
  readConnectionId,
  readTelephonyApiKey,
} from '@/lib/telephony/telnyx/env';

export function readVoiceApiKey(): string | null {
  return readTelephonyApiKey();
}

export function voiceApiBearerToken(): string {
  return readVoiceApiKey() ?? '';
}

export function readConfiguredConnectionId(): string | null {
  return readConnectionId();
}

/** @deprecated Legacy alias — always null */
export function readTelephonyCredentialId(): string | null {
  return null;
}
