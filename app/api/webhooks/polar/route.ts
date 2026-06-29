import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { claimWebhookEvent } from '@/lib/webhooks/dedup';
import { isBillingCycle, isPaidPlan } from '@/lib/plan/polar';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null ? value as JsonRecord : {};
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNestedString(record: JsonRecord, paths: string[][]): string | null {
  for (const path of paths) {
    let current: unknown = record;
    for (const key of path) current = asRecord(current)[key];
    const value = getString(current);
    if (value) return value;
  }
  return null;
}

function toIso(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000).toISOString();
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function decodeSecret(secret: string) {
  if (secret.startsWith('whsec_')) {
    return Buffer.from(secret.slice('whsec_'.length), 'base64');
  }
  return Buffer.from(secret, 'utf8');
}

function parseSignatures(signatureHeader: string) {
  return signatureHeader
    .split(/\s+/)
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .map((part) => part.startsWith('v1=') ? part.slice(3) : part)
    .filter((part) => part && part !== 'v1');
}

function verifyPolarSignature(body: string, request: NextRequest): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signature = request.headers.get('webhook-signature');

  if (!secret || !id || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const age = Math.abs(Date.now() / 1000 - ts);
  if (age > 60 * 5) return false;

  const signedPayload = `${id}.${timestamp}.${body}`;
  const expected = createHmac('sha256', decodeSecret(secret)).update(signedPayload).digest();

  for (const candidate of parseSignatures(signature)) {
    const actual = Buffer.from(candidate, 'base64');
    if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;
  }

  return false;
}

function normalizeSubscription(eventType: string, object: JsonRecord) {
  const metadata = asRecord(object.metadata);
  const customer = asRecord(object.customer);
  const product = asRecord(object.product);
  const plan = getNestedString({ metadata }, [['metadata', 'plan']]);
  const billingCycle = getNestedString({ metadata }, [['metadata', 'billingCycle'], ['metadata', 'cycle']]);
  const seatsRaw = Number(getNestedString({ metadata }, [['metadata', 'seats']]) ?? object.seats ?? 1);
  const status = eventType.endsWith('.canceled')
    ? 'canceled'
    : getString(object.status) ?? 'active';

  return {
    userId: getNestedString({ metadata, customer, object }, [
      ['metadata', 'userId'],
      ['metadata', 'user_id'],
      ['customer', 'external_id'],
      ['object', 'external_customer_id'],
    ]),
    plan: isPaidPlan(plan) ? plan : null,
    billingCycle: isBillingCycle(billingCycle) ? billingCycle : 'monthly',
    seats: Number.isInteger(seatsRaw) ? Math.max(1, Math.min(500, seatsRaw)) : 1,
    status,
    polarSubscriptionId: getString(object.id),
    polarCustomerId: getNestedString({ object, customer }, [['object', 'customer_id'], ['customer', 'id']]),
    polarCheckoutId: getNestedString({ object, metadata }, [['object', 'checkout_id'], ['metadata', 'checkoutId'], ['metadata', 'checkout_id']]),
    polarProductId: getNestedString({ object, product, metadata }, [['object', 'product_id'], ['product', 'id'], ['metadata', 'productId']]),
    trialEndsAt: toIso(object.trial_end ?? object.trial_ends_at),
    currentPeriodStart: toIso(object.current_period_start ?? object.started_at),
    currentPeriodEnd: toIso(object.current_period_end ?? object.ends_at),
    metadata,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  if (!verifyPolarSignature(body, request)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: JsonRecord;
  try {
    event = JSON.parse(body) as JsonRecord;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventType = getString(event.type) ?? getString(event.event) ?? 'unknown';
  const eventId = request.headers.get('webhook-id') ?? getString(event.id) ?? randomUUID();
  const object = asRecord(asRecord(event.data).object ?? event.data);
  const supabase = createServiceClient();

  if (!supabase) {
    console.error('[POLAR-WEBHOOK] Service client unavailable');
    return NextResponse.json({ received: true });
  }

  const claimed = await claimWebhookEvent(supabase, eventId, 'polar', eventType);
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (eventType === 'checkout.created') {
      console.log('[POLAR-WEBHOOK] checkout.created', getString(object.id));
      return NextResponse.json({ received: true });
    }

    if (
      eventType === 'subscription.created'
      || eventType === 'subscription.updated'
      || eventType === 'subscription.canceled'
    ) {
      const normalized = normalizeSubscription(eventType, object);
      const safeStatus = ['trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'].includes(normalized.status)
        ? normalized.status
        : 'active';

      if (normalized.userId && normalized.plan) {
        const { error } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: normalized.userId,
              plan: normalized.plan,
              billing_cycle: normalized.billingCycle,
              seats: normalized.seats,
              status: safeStatus,
              trial_ends_at: normalized.trialEndsAt,
              current_period_start: normalized.currentPeriodStart,
              current_period_end: normalized.currentPeriodEnd,
              polar_customer_id: normalized.polarCustomerId,
              polar_subscription_id: normalized.polarSubscriptionId,
              polar_checkout_id: normalized.polarCheckoutId,
              polar_product_id: normalized.polarProductId,
              metadata: normalized.metadata,
            },
            { onConflict: 'user_id' },
          );
        if (error) throw error;
      } else if (normalized.polarSubscriptionId) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: safeStatus })
          .eq('polar_subscription_id', normalized.polarSubscriptionId);
        if (error) throw error;
      } else {
        console.warn('[POLAR-WEBHOOK] Subscription event missing user and subscription id', eventType);
      }
    } else {
      console.log('[POLAR-WEBHOOK] Unhandled event', eventType);
    }
  } catch (error) {
    console.error('[POLAR-WEBHOOK] Handler failed', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
