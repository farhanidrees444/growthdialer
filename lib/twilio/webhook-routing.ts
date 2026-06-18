import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';
import { parseTwilioClientIdentity, toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';

export interface InboundRouteResult {
  clientIdentity: string;
  userId: string;
  toNumber: string;
  fromNumber: string;
  purchasedNumberId: string | null;
  routing: Awaited<ReturnType<typeof resolveNumberRouting>>;
}

export interface OutboundRouteResult {
  userId: string;
  callerId: string;
  toNumber: string;
  purchasedNumberId: string | null;
  routing: Awaited<ReturnType<typeof resolveNumberRouting>>;
}

export function twilioStatusCallbackUrl(): string | undefined {
  const base = resolveVoiceAppBaseUrl();
  return base ? `${base}/api/twilio/status-callback` : undefined;
}

export function twilioRecordingCallbackUrl(): string | undefined {
  const base = resolveVoiceAppBaseUrl();
  return base ? `${base}/api/twilio/recording` : undefined;
}

export function twilioInboundDialStatusUrl(): string | undefined {
  const base = resolveVoiceAppBaseUrl();
  return base ? `${base}/api/twilio/inbound-dial-status` : undefined;
}

const STATUS_EVENTS = [
  'initiated',
  'ringing',
  'answered',
  'completed',
  'busy',
  'no-answer',
  'failed',
  'canceled',
] as const;

export function dialStatusCallbackOptions(statusCallback: string | undefined) {
  if (!statusCallback) return {};
  return {
    statusCallback,
    statusCallbackEvent: [...STATUS_EVENTS],
    statusCallbackMethod: 'POST' as const,
  };
}

export async function resolveInboundRoute(
  supabase: SupabaseClient,
  to: string,
  from: string,
): Promise<InboundRouteResult | null> {
  const toE164 = normalizeE164(to);
  if (!toE164) return null;

  const owner = await getCachedNumberOwner(supabase, toE164);
  if (!owner?.user_id) return null;

  const { data: numRow } = await supabase
    .from('purchased_numbers')
    .select('id')
    .eq('phone_number', toE164)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  const purchasedNumberId = (numRow?.id as string | undefined) ?? null;
  const routing = await resolveNumberRouting(supabase, owner.user_id, purchasedNumberId ?? undefined);

  return {
    clientIdentity: toTwilioClientIdentity(owner.user_id),
    userId: owner.user_id,
    toNumber: toE164,
    fromNumber: normalizeE164(from) ?? from,
    purchasedNumberId,
    routing,
  };
}

export async function resolveOutboundRoute(
  supabase: SupabaseClient,
  from: string,
  to: string,
  callerIdOverride?: string | null,
): Promise<OutboundRouteResult | null> {
  const userId = parseTwilioClientIdentity(from);
  if (!userId) return null;

  const toE164 = normalizeE164(to);
  if (!toE164) return null;

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, is_default')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: false });

  const rows = numbers ?? [];
  const override = callerIdOverride?.trim();
  let callerId: string | null = null;
  let purchasedNumberId: string | null = null;

  if (override && isValidCallerPhone(override)) {
    const overrideE164 = normalizeE164(override);
    const match = rows.find((n) => normalizeE164(n.phone_number as string) === overrideE164);
    if (match) {
      callerId = overrideE164;
      purchasedNumberId = match.id as string;
    }
  }

  if (!callerId && rows[0]?.phone_number) {
    callerId = normalizeE164(rows[0].phone_number as string);
    purchasedNumberId = rows[0].id as string;
  }

  if (!callerId) return null;

  const routing = await resolveNumberRouting(supabase, userId, purchasedNumberId ?? undefined);

  return { userId, callerId, toNumber: toE164, purchasedNumberId, routing };
}
