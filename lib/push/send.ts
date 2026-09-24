import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Web Push sender (inbound call ring) ─────────────────────────────────────
// Server-side only: VAPID_PRIVATE_KEY must never leave the server.

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
}

async function loadWebPush() {
  return (await import('web-push')) as typeof import('web-push');
}

function getVapidConfig():
  | { publicKey: string; privateKey: string; subject: string }
  | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ?? 'mailto:hello@growthdialer.com';
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

/**
 * Send an inbound-call push to every subscription registered by the given
 * user. Expired/unknown subscriptions (410/404) are pruned. Best-effort —
 * failures are logged and never block the call flow.
 */
export async function sendInboundCallPush(
  supabase: SupabaseClient,
  userId: string,
  callerNumber?: string | null,
): Promise<void> {
  const vapid = getVapidConfig();
  if (!vapid) {
    console.log('[PUSH] skipped: VAPID keys not configured');
    return;
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) {
    console.error('[PUSH] failed to load subscriptions:', error.message);
    return;
  }
  if (!subscriptions?.length) return;

  const { setVapidDetails, sendNotification } = await loadWebPush();
  setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const body = callerNumber && callerNumber.trim()
    ? `Incoming call from ${callerNumber.trim()}`
    : 'Incoming call';
  const payload = JSON.stringify({
    title: 'Incoming call',
    body,
    url: '/incoming',
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      const record = sub as unknown as PushSubscriptionRecord & { id: string };
      if (!record.p256dh || !record.auth) {
        return;
      }
      try {
        await sendNotification(
          {
            endpoint: record.endpoint,
            keys: { p256dh: record.p256dh, auth: record.auth },
          },
          payload,
          { TTL: 30 },
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number } | null)?.statusCode;
        if (status === 404 || status === 410) {
          // Dead subscription — prune it.
          await supabase.from('push_subscriptions').delete().eq('id', record.id);
          console.log('[PUSH] pruned dead subscription', record.id);
        } else {
          console.error('[PUSH] send failed:', err);
        }
      }
    }),
  );
}
