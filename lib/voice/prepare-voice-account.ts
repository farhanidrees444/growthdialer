import type { SupabaseClient } from '@supabase/supabase-js';
import { getTelephonyProvider } from '@/lib/telephony';
import { resolveActiveCredentialId } from '@/lib/telnyx/active-credential';
import { prepareInboundAccount, type PrepareInboundResult } from '@/lib/inbound/prepare-account';
import { invalidateNumberOwnerCache } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { ensureVoiceConnectionConfigured } from '@/lib/voice/configure-connection';
import { readCallControlAppId } from '@/lib/voice/read-env';
import {
  activateRoutingForNumbers,
  auditNumberRouting,
  backfillProviderIds,
  fetchProviderPhoneIndex,
  type DbNumberRow,
} from '@/lib/voice/provider-numbers';

export interface PrepareVoiceAccountResult extends PrepareInboundResult {
  outbound_ready: boolean;
  default_caller_id: string | null;
  user_id: string;
}

/** Per-account voice setup: numbers, workspace link, routing, browser credential. */
export async function prepareVoiceAccount(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<PrepareVoiceAccountResult> {
  const inbound = await prepareInboundAccount(supabase, userId, userEmail);

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, is_default, status, telnyx_number_id')
    .eq('user_id', userId)
    .neq('status', 'released')
    .order('is_default', { ascending: false })
    .order('purchased_at', { ascending: true });

  const rows = (numbers ?? []) as DbNumberRow[];
  let defaultCallerId: string | null = null;
  let credentialReady = false;
  let primaryRouted = inbound.primary_routed;
  let connectionConfigured = false;
  let routingActivated = 0;

  if (rows.length > 0) {
    const hasDefault = rows.some((n) => n.is_default);
    if (!hasDefault) {
      await supabase
        .from('purchased_numbers')
        .update({ is_default: true })
        .eq('id', rows[0].id);
      rows[0].is_default = true;
      defaultCallerId = normalizeE164(rows[0].phone_number);
    } else {
      const primary = rows.find((n) => n.is_default) ?? rows[0];
      defaultCallerId = normalizeE164(primary.phone_number);
    }

    for (const row of rows) {
      invalidateNumberOwnerCache(row.phone_number);
    }
  }

  if (getTelephonyProvider().isConfigured()) {
    const connection = await ensureVoiceConnectionConfigured();
    connectionConfigured = connection.ok;

    const credentialId = await resolveActiveCredentialId(supabase, userId);
    credentialReady = Boolean(credentialId);

    const callControlAppId = readCallControlAppId();
    if (callControlAppId && rows.length > 0) {
      const providerIndex = await fetchProviderPhoneIndex();
      await backfillProviderIds(supabase, rows, providerIndex);

      let audit = await auditNumberRouting(rows, callControlAppId, providerIndex);
      if (audit.needs_activation) {
        const activate = await activateRoutingForNumbers(rows, callControlAppId, providerIndex);
        routingActivated = activate.activated;
        audit = await auditNumberRouting(rows, callControlAppId, providerIndex);
      }
      primaryRouted = audit.primary_routed;
    }
  }

  return {
    ...inbound,
    phones_normalized: inbound.phones_normalized,
    workspace_linked: inbound.workspace_linked,
    routing_activated: routingActivated,
    credential_ready: credentialReady,
    primary_routed: primaryRouted,
    connection_configured: connectionConfigured,
    outbound_ready: Boolean(defaultCallerId),
    default_caller_id: defaultCallerId,
    user_id: userId,
    message:
      rows.length === 0
        ? 'Contact support to assign a voice line to your account.'
        : primaryRouted && credentialReady
          ? 'Your inbound line is configured and ready.'
          : 'Voice setup is in progress — keep this tab open.',
  };
}
