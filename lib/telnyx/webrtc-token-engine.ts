import { Telnyx } from 'telnyx';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCredentialToken } from '@/lib/voice/credential-discovery';
import { readConfiguredConnectionId, readVoiceApiKey } from '@/lib/voice/read-env';
import {
  fetchCredentialSipUsername,
  resolvePerUserCredentialId,
} from '@/lib/telnyx/active-credential';

export type WebRtcTokenResult =
  | { ok: true; login_token: string; credential_id: string; sip_username?: string }
  | { ok: false; status: number; error: string; detail?: string };

let telnyxSdk: Telnyx | null = null;

function getTelnyxSdk(): Telnyx | null {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return null;
  if (!telnyxSdk) {
    telnyxSdk = new Telnyx({ apiKey });
  }
  return telnyxSdk;
}

/** On-demand WebRTC JWT via Telnyx telephonyCredentials.createToken. */
async function createTelephonyJwt(credentialId: string): Promise<string | null> {
  const sdk = getTelnyxSdk();
  if (sdk) {
    try {
      const token = await sdk.telephonyCredentials.createToken(credentialId);
      const jwt = typeof token === 'string' ? token.trim() : String(token ?? '').trim();
      if (jwt) return jwt;
    } catch (err) {
      console.error('[telnyx/token] SDK createToken failed:', credentialId, err);
    }
  }

  return fetchCredentialToken(credentialId, { fresh: true, bypassNegativeCache: true });
}

/**
 * Issue a per-user browser WebRTC JWT bound to TELNYX_CONNECTION_ID.
 * Each logged-in agent gets their own telephony credential (gencred*).
 */
export async function issueUserWebRtcToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<WebRtcTokenResult> {
  const connectionId = readConfiguredConnectionId();
  if (!connectionId) {
    return {
      ok: false,
      status: 503,
      error: 'Voice service is not configured.',
      detail: 'TELNYX_CONNECTION_ID is missing',
    };
  }

  const credentialId = await resolvePerUserCredentialId(supabase, userId);
  if (!credentialId) {
    console.error('[telnyx/token] no credential for user:', userId, '| connection:', connectionId);
    return {
      ok: false,
      status: 503,
      error: 'Voice service is not configured. Contact your workspace owner.',
      detail: 'Could not resolve or create a telephony credential for this user.',
    };
  }

  const loginToken = await createTelephonyJwt(credentialId);
  if (!loginToken) {
    console.error('[telnyx/token] JWT issuance failed | credential:', credentialId, '| user:', userId);
    return {
      ok: false,
      status: 503,
      error: 'Could not issue browser voice token.',
      detail: `Token creation failed for credential ${credentialId}`,
    };
  }

  const sipUsername = await fetchCredentialSipUsername(credentialId);
  return {
    ok: true,
    login_token: loginToken,
    credential_id: credentialId,
    sip_username: sipUsername ?? undefined,
  };
}
