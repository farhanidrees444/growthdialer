import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';

const VOICE_API = 'https://api.telnyx.com/v2';

export interface ConnectionConfigureResult {
  ok: boolean;
  connection_id: string | null;
  webhook_url: string | null;
  message: string;
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
    };
  }

  try {
    const res = await fetch(`${VOICE_API}/credential_connections/${connectionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_event_url: webhookUrl,
        webhook_api_version: '2',
        webhook_timeout_secs: 25,
        sip_uri_calling_preference: 'internal',
        outbound: {
          call_parking_enabled: true,
        },
        inbound: {
          generate_ringback_tone: true,
        },
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error('[VOICE] connection configure failed:', res.status, detail);
      return {
        ok: false,
        connection_id: connectionId,
        webhook_url: webhookUrl,
        message: 'Could not update voice connection settings.',
      };
    }

    return {
      ok: true,
      connection_id: connectionId,
      webhook_url: webhookUrl,
      message: 'Voice connection configured for inbound browser routing.',
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
