import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';

const VOICE_API = 'https://api.telnyx.com/v2';

export interface ConnectionConfigureResult {
  ok: boolean;
  connection_id: string | null;
  webhook_url: string | null;
  message: string;
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

async function detectSwappedConnectionId(
  apiKey: string,
  connectionId: string,
): Promise<boolean> {
  const asConnection = await voiceGet(`credential_connections/${connectionId}`, apiKey);
  if (asConnection.ok) return false;

  if (asConnection.status !== 404) return false;

  const asCredential = await voiceGet(`telephony_credentials/${connectionId}`, apiKey);
  return asCredential.ok;
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

/**
 * Align credential connection with GrowthDialer inbound/outbound requirements.
 * Safe to call repeatedly (idempotent PATCH).
 */
export async function ensureVoiceConnectionConfigured(): Promise<ConnectionConfigureResult> {
  const apiKey = process.env.TELNYX_API_KEY?.trim();
  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();
  const webhookUrl = resolveVoiceWebhookUrl();

  if (!apiKey || !connectionId) {
    return {
      ok: false,
      connection_id: connectionId ?? null,
      webhook_url: webhookUrl || null,
      message: 'Voice connection credentials are not configured on the server.',
    };
  }

  if (!webhookUrl) {
    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: null,
      message: 'Application URL is not configured for call events.',
      detail: 'Set APP_URL or NEXT_PUBLIC_APP_URL to your live app origin (e.g. https://app.growthdialer.com).',
    };
  }

  try {
    const swapped = await detectSwappedConnectionId(apiKey, connectionId);
    if (swapped) {
      return {
        ok: false,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection ID looks incorrect on the server.',
        detail:
          'TELNYX_CONNECTION_ID appears to be a browser credential ID. Use your SIP Connection ID instead, and keep the credential in TELNYX_TELEPHONY_CREDENTIAL_ID.',
      };
    }

    const getRes = await voiceGet(`credential_connections/${connectionId}`, apiKey);
    if (!getRes.ok) {
      const detail = (await getRes.text()).slice(0, 300);
      console.error('[VOICE] connection GET failed:', getRes.status, detail);
      return {
        ok: false,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Voice connection could not be loaded.',
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
      };
    }

    const patchDetail = (await patchRes.text()).slice(0, 300);
    console.error('[VOICE] connection configure failed:', patchRes.status, patchDetail);

    // Retry with webhook + SIP only (avoids outbound profile validation issues).
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
      };
    }

    const retryDetail = (await retryRes.text()).slice(0, 300);
    console.error('[VOICE] connection minimal configure failed:', retryRes.status, retryDetail);

    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: webhookUrl,
      message: 'Could not update voice connection settings.',
      detail: `PATCH failed (${patchRes.status}); minimal retry (${retryRes.status})`,
    };
  } catch (err) {
    console.error('[VOICE] connection configure exception:', err);
    return {
      ok: false,
      connection_id: connectionId,
      webhook_url: webhookUrl,
      message: 'Voice connection update failed.',
    };
  }
}
