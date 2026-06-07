import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';

/** Outbound events GrowthDialer can emit to a user-configured HTTPS endpoint. */
export type GrowthDialerWebhookEvent =
  | 'call_completed'
  | 'call_started'
  | 'disposition_set'
  | 'meeting_booked'
  | 'webhook_test';

export type OutgoingWebhookConfig = {
  url: string | null;
  hasSecret: boolean;
};

const WEBHOOK_TIMEOUT_MS = 12_000;

function isValidHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.length > 0;
  } catch {
    return false;
  }
}

export function validateOutgoingWebhookUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return 'Webhook URL is required';
  if (!isValidHttpsUrl(trimmed)) return 'Webhook URL must be a valid HTTPS URL';
  if (trimmed.length > 2048) return 'Webhook URL is too long';
  return null;
}

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function getOutgoingWebhookConfig(userId: string): Promise<OutgoingWebhookConfig | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('outgoing_webhook_url, outgoing_webhook_secret')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[webhooks/outgoing] fetch config failed:', error.message);
    return null;
  }

  return {
    url: data?.outgoing_webhook_url ?? null,
    hasSecret: Boolean(data?.outgoing_webhook_secret),
  };
}

/**
 * Fires a signed POST to the user's configured outgoing webhook URL.
 * Safe to call from server routes / webhooks — no-ops when URL is unset.
 */
export async function triggerGrowthDialerWebhook(
  userId: string,
  eventType: GrowthDialerWebhookEvent,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: 'Service client unavailable' };
  }

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('outgoing_webhook_url, outgoing_webhook_secret')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[webhooks/outgoing] load settings failed:', error.message);
    return { ok: false, error: error.message };
  }

  const url = settings?.outgoing_webhook_url?.trim();
  if (!url) {
    return { ok: true, skipped: true };
  }

  const body = JSON.stringify({
    event: eventType,
    timestamp: new Date().toISOString(),
    user_id: userId,
    data,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GrowthDialer-Webhooks/1.0',
    'X-GrowthDialer-Event': eventType,
  };

  const secret = settings?.outgoing_webhook_secret;
  if (secret) {
    headers['X-GrowthDialer-Signature'] = signPayload(secret, body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[webhooks/outgoing] delivery failed:', res.status, text.slice(0, 200));
      return { ok: false, status: res.status, error: `Webhook returned ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook request failed';
    console.warn('[webhooks/outgoing] delivery error:', message);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export type CallWebhookPayload = {
  call_id: string;
  workspace_id: string;
  lead_id?: string | null;
  disposition?: string | null;
  notes?: string | null;
  duration_seconds?: number | null;
  direction?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  meeting_at?: string | null;
  callback_at?: string | null;
};

/** Fire one or more outbound events for the call owner (fire-and-forget). */
export function emitCallWebhooks(
  ownerUserId: string,
  events: GrowthDialerWebhookEvent[],
  data: CallWebhookPayload,
): void {
  for (const event of events) {
    void triggerGrowthDialerWebhook(ownerUserId, event, data).catch((err) => {
      console.warn('[webhooks/outgoing] emit failed:', event, err);
    });
  }
}

/** Verify an incoming signature (for future inbound verification helpers). */
export function verifyGrowthDialerSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const expected = signPayload(secret, rawBody);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
