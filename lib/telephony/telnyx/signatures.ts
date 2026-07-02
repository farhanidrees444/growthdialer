import nacl from 'tweetnacl';
import { readTelephonyPublicKey } from '@/lib/telephony/telnyx/env';

const FIVE_MIN_MS = 5 * 60 * 1000;

export interface VerifyWebhookResult {
  ok: boolean;
  reason?: string;
}

function b64decode(input: string): Uint8Array {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): VerifyWebhookResult {
  const publicKeyB64 = readTelephonyPublicKey();

  if (!publicKeyB64) {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowSkip = process.env.TELNYX_SKIP_WEBHOOK_VERIFY === 'true';
    if (isProduction && !allowSkip) {
      console.error('[telephony/webhook] public key missing in production');
      return { ok: false, reason: 'verification_required_no_key' };
    }
    console.warn('[telephony/webhook] signature verification skipped (no public key)');
    return { ok: true, reason: 'verification_skipped_no_key' };
  }

  if (!signature || !timestamp) {
    return { ok: false, reason: 'missing_signature_or_timestamp' };
  }

  const tsSeconds = Number.parseInt(timestamp, 10);
  if (Number.isFinite(tsSeconds)) {
    const ageMs = Date.now() - tsSeconds * 1000;
    if (Math.abs(ageMs) > FIVE_MIN_MS) {
      return { ok: false, reason: `timestamp_too_old (${Math.round(ageMs / 1000)}s)` };
    }
  }

  try {
    const publicKey = b64decode(publicKeyB64);
    const signatureBytes = b64decode(signature);
    const message = new TextEncoder().encode(`${timestamp}|${rawBody}`);
    const valid = nacl.sign.detached.verify(message, signatureBytes, publicKey);
    return valid ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
  } catch (err) {
    return {
      ok: false,
      reason: `verify_exception: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
