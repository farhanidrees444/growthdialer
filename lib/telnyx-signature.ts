// Telnyx ed25519 webhook signature verification.
// Docs: https://developers.telnyx.com/docs/api/v2/overview#receiving-webhooks
//
// Telnyx signs every webhook with an ed25519 signature over the timestamp +
// raw body. We verify it with the public key from Vercel env
// (TELNYX_PUBLIC_KEY — copy it from Telnyx Portal → API Keys page).
//
// Skips verification when TELNYX_PUBLIC_KEY is unset (allows local dev),
// but logs a loud warning so production failures are visible.

import nacl from 'tweetnacl';

const FIVE_MIN_MS = 5 * 60 * 1000;

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

/**
 * Decode a base64 string into a Uint8Array (Edge runtime safe).
 */
function b64decode(input: string): Uint8Array {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function verifyTelnyxSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): VerifyResult {
  const publicKeyB64 = process.env.TELNYX_PUBLIC_KEY?.trim();

  if (!publicKeyB64) {
    console.warn(
      '[TELNYX-VERIFY] TELNYX_PUBLIC_KEY not set — webhook signatures are NOT being verified. ' +
      'Copy the public key from Telnyx Portal → API Keys → Public Key and set it in Vercel.',
    );
    return { ok: true, reason: 'verification_skipped_no_key' };
  }

  if (!signature || !timestamp) {
    return { ok: false, reason: 'missing_signature_or_timestamp' };
  }

  // Reject replays older than 5 minutes
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
    return { ok: false, reason: `verify_exception: ${err instanceof Error ? err.message : String(err)}` };
  }
}
