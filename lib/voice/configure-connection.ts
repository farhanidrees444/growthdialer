import { readVoiceApiKey } from '@/lib/voice/read-env';
import { resolveVoiceConnectionId } from '@/lib/voice/resolve-connection';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';

const VOICE_API = 'https://api.telnyx.com/v2';

export type ConnectionFailureReason =
  | 'missing_api_key'
  | 'missing_connection_id'
  | 'missing_app_url'
  | 'env_id_is_credential'
  | 'auth_failed'
  | 'not_found'
  | 'patch_failed'
  | 'network';

export interface ConnectionConfigureResult {
  ok: boolean;
  connection_id: string | null;
  webhook_url: string | null;
  message: string;
  resolved_from?: 'env' | 'credential';
  env_mismatch?: boolean;
  failure_reason?: ConnectionFailureReason;
  /** Owner-only diagnostics — never shown in user-facing UI verbatim. */
  detail?: string;
}

interface CredentialConnectionData {
  webhook_event_url?: string | null;
  webhook_api_version?: string | null;
  sip_uri_calling_preference?: string | null;
  outbound?: {
    call_parking_enabled?: boolean;
    outbound_voice_profile_id?: string | null;
    [key: string]: unknown;
  } | null;
}

async function voiceGet(path: string, apiKey: string): Promise<Response> {
  return fetch(`${VOICE_API}/${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

function connectionAlreadyConfigured(
  data: CredentialConnectionData,
  webhookUrl: string,
): boolean {
  const webhookOk =
    (data.webhook_event_url ?? '').replace(/\/$/, '') === webhookUrl.replace(/\/$/, '')
    && data.webhook_api_version === '2';
  const sipOk = data.sip_uri_calling_preference === 'internal';
  const parkingOk = data.outbound?.call_parking_enabled !== false;
  return webhookOk && sipOk && parkingOk;
}

function mapGetFailure(status: number): ConnectionFailureReason {
  if (status === 401 || status === 403) return 'auth_failed';
  if (status === 404) return 'not_found';
  return 'network';
}

/**
 * Align credential connection with GrowthDialer inbound/outbound requirements.
 * Safe to call repeatedly (idempotent PATCH).
 */
export async function ensureVoiceConnectionConfigured(): Promise<ConnectionConfigureResult> {
  const apiKey = readVoiceApiKey();
  const webhookUrl = resolveVoiceWebhookUrl();
  const resolved = await resolveVoiceConnectionId();
  const connectionId = resolved.connectionId;

  if (!apiKey) {
    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: webhookUrl || null,
      message: 'Voice API key is not configured on the server.',
      failure_reason: 'missing_api_key',
    };
  }

  if (!connectionId) {
    return {
      ok: false,
      connection_id: null,
      webhook_url: webhookUrl || null,
      message: 'Voice connection ID is not configured on the server.',
      failure_reason: 'missing_connection_id',
      env_mismatch: resolved.envMismatch,
    };
  }

  if (!webhookUrl) {
    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: null,
      message: 'Application URL is not configured for call events.',
      failure_reason: 'missing_app_url',
      detail: 'Set APP_URL or NEXT_PUBLIC_APP_URL to your live app origin.',
    };
  }

  if (resolved.envMismatch && resolved.source === 'credential') {
    console.warn(
      '[VOICE] TELNYX_CONNECTION_ID does not match browser credential parent — using resolved connection',
      connectionId,
    );
  }

  try {
    const getRes = await voiceGet(`credential_connections/${connectionId}`, apiKey);
    if (!getRes.ok) {
      const detail = (await getRes.text()).slice(0, 300);
      const reason = mapGetFailure(getRes.status);
      console.error('[VOICE] connection GET failed:', getRes.status, detail);

      return {
        ok: false,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message:
          reason === 'auth_failed'
            ? 'Voice API key was rejected by the provider.'
            : reason === 'not_found'
              ? 'Voice connection could not be found for this account.'
              : 'Voice connection could not be loaded.',
        failure_reason: reason,
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
        detail: `GET credential_connections/${connectionId} → ${getRes.status}`,
      };
    }

    const getJson = await getRes.json() as { data?: CredentialConnectionData };
    const current = getJson.data ?? {};

    if (connectionAlreadyConfigured(current, webhookUrl)) {
      return {
        ok: true,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection configured for inbound browser routing.',
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
      };
    }

    const patchBody: Record<string, unknown> = {};

    if ((current.webhook_event_url ?? '').replace(/\/$/, '') !== webhookUrl.replace(/\/$/, '')) {
      patchBody.webhook_event_url = webhookUrl;
    }
    if (current.webhook_api_version !== '2') {
      patchBody.webhook_api_version = '2';
      patchBody.webhook_timeout_secs = 25;
    }
    if (current.sip_uri_calling_preference !== 'internal') {
      patchBody.sip_uri_calling_preference = 'internal';
    }
    if (!current.outbound?.call_parking_enabled) {
      patchBody.outbound = {
        ...(current.outbound ?? {}),
        call_parking_enabled: true,
      };
    }

    if (Object.keys(patchBody).length === 0) {
      return {
        ok: true,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection configured for inbound browser routing.',
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
      };
    }

    const patchRes = await fetch(`${VOICE_API}/credential_connections/${connectionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    if (patchRes.ok) {
      return {
        ok: true,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection configured for inbound browser routing.',
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
      };
    }

    const patchDetail = (await patchRes.text()).slice(0, 300);
    console.error('[VOICE] connection configure failed:', patchRes.status, patchDetail);

    const minimalBody = {
      webhook_event_url: webhookUrl,
      webhook_api_version: '2',
      webhook_timeout_secs: 25,
      sip_uri_calling_preference: 'internal',
    };

    const retryRes = await fetch(`${VOICE_API}/credential_connections/${connectionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalBody),
    });

    if (retryRes.ok) {
      return {
        ok: true,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection configured for inbound browser routing.',
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
      };
    }

    const retryDetail = (await retryRes.text()).slice(0, 300);
    console.error('[VOICE] connection minimal configure failed:', retryRes.status, retryDetail);

    // Connection exists and is readable — don't block inbound if portal already has webhooks.
    const webhookReachable =
      Boolean(current.webhook_event_url)
      && current.sip_uri_calling_preference === 'internal';

    if (webhookReachable) {
      return {
        ok: true,
        connection_id: connectionId,
        webhook_url: current.webhook_event_url ?? webhookUrl,
        message: 'Voice connection is active (using existing portal settings).',
        resolved_from: resolved.source === 'none' ? undefined : resolved.source,
        env_mismatch: resolved.envMismatch,
      };
    }

    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: webhookUrl,
      message: 'Could not update voice connection settings.',
      failure_reason: 'patch_failed',
      resolved_from: resolved.source === 'none' ? undefined : resolved.source,
      env_mismatch: resolved.envMismatch,
      detail: `PATCH failed (${patchRes.status}); minimal retry (${retryRes.status})`,
    };
  } catch (err) {
    console.error('[VOICE] connection configure exception:', err);
    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: webhookUrl,
      message: 'Voice connection update failed.',
      failure_reason: 'network',
    };
  }
}

/** Connection ID for routing/bridge — always resolved with credential fallback. */
export async function getActiveVoiceConnectionId(): Promise<string | null> {
  const resolved = await resolveVoiceConnectionId();
  return resolved.connectionId;
}
