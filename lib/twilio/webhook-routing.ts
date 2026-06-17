import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { parseTwilioClientIdentity, toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';

export interface InboundRouteResult {
  clientIdentity: string;
  userId: string;
  toNumber: string;
  fromNumber: string;
}

export interface OutboundRouteResult {
  userId: string;
  callerId: string;
  toNumber: string;
}

export function twilioStatusCallbackUrl(): string | undefined {
  const base = resolveVoiceAppBaseUrl();
  return base ? `${base}/api/twilio/status` : undefined;
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

  return {
    clientIdentity: toTwilioClientIdentity(owner.user_id),
    userId: owner.user_id,
    toNumber: toE164,
    fromNumber: normalizeE164(from) ?? from,
  };
}

export async function resolveOutboundRoute(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<OutboundRouteResult | null> {
  const userId = parseTwilioClientIdentity(from);
  if (!userId) return null;

  const toE164 = normalizeE164(to);
  if (!toE164) return null;

  const { data: numberRow } = await supabase
    .from('purchased_numbers')
    .select('phone_number')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const callerId = numberRow?.phone_number
    ? normalizeE164(numberRow.phone_number as string)
    : null;

  if (!callerId) return null;

  return { userId, callerId, toNumber: toE164 };
}

export function isLikelyInboundPstn(
  direction: string | undefined,
  to: string,
  supabaseCheck: boolean,
): boolean {
  const d = (direction ?? '').toLowerCase();
  if (d === 'inbound') return true;
  if (d.startsWith('outbound')) return false;
  return supabaseCheck;
}
