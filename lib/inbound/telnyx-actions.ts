import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { voiceApiBearerToken } from '@/lib/voice/read-env';

export interface TelnyxActionResult {
  ok: boolean;
  status?: number;
  detail?: string;
  call_control_id?: string;
}

export async function telnyxCallAction(
  callControlId: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<boolean> {
  const result = await telnyxCallActionDetailed(callControlId, action, body);
  return result.ok;
}

export async function telnyxCallActionDetailed(
  callControlId: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<TelnyxActionResult> {
  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/${action}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${voiceApiBearerToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    const detail = (await res.text()).slice(0, 400);
    if (!res.ok) {
      console.error(`[INBOUND] voice ${action} failed:`, res.status, detail);
    }
    return { ok: res.ok, status: res.status, detail };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[INBOUND] voice ${action} exception:`, detail);
    return { ok: false, detail };
  }
}

/** Originate a new call leg (used to ring the browser WebRTC endpoint). */
export async function dialVoiceLeg(params: {
  connectionId: string;
  to: string;
  from: string;
  clientState?: Record<string, unknown>;
  timeoutSecs?: number;
  /** Link outbound leg to an existing inbound call_control_id */
  linkTo?: string;
}): Promise<TelnyxActionResult> {
  const webhookUrl = resolveVoiceWebhookUrl();
  if (!webhookUrl) {
    console.error(
      '[INBOUND] Cannot dial browser leg — set APP_URL or NEXT_PUBLIC_APP_URL to your live app origin',
    );
    return { ok: false, detail: 'webhook_url_missing' };
  }

  try {
    const body: Record<string, unknown> = {
      connection_id: params.connectionId,
      to: params.to,
      from: params.from,
      webhook_url: webhookUrl,
      webhook_url_method: 'POST',
      webhook_api_version: '2',
      timeout_secs: params.timeoutSecs ?? 45,
    };

    if (params.clientState) {
      body.client_state = Buffer.from(JSON.stringify(params.clientState)).toString('base64');
    }
    if (params.linkTo) {
      body.link_to = params.linkTo;
    }

    console.log('[INBOUND] dial leg | connection:', params.connectionId, '| to:', params.to, '| link_to:', params.linkTo ?? 'none');

    const res = await fetch('https://api.telnyx.com/v2/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${voiceApiBearerToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[INBOUND] dial leg failed:', res.status, text.slice(0, 400));
      return { ok: false, status: res.status, detail: text.slice(0, 400) };
    }

    const json = JSON.parse(text) as { data?: { call_control_id?: string } };
    const callControlId = json.data?.call_control_id;
    if (!callControlId) {
      return { ok: false, detail: 'missing_call_control_id' };
    }

    return { ok: true, call_control_id: callControlId };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[INBOUND] dial leg exception:', detail);
    return { ok: false, detail };
  }
}

export function decodeClientState(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}
