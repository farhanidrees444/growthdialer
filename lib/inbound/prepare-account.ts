import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { resolveActiveCredentialId } from '@/lib/telnyx/active-credential';
import {
  activateRoutingForNumbers,
  auditNumberRouting,
  backfillProviderIds,
  connectionsMatch,
  fetchProviderPhoneIndex,
  lookupProviderPhone,
  type DbNumberRow,
} from '@/lib/voice/provider-numbers';
import { assignNumberToVoiceConnection } from '@/lib/voice/assign-number-connection';
import { readVoiceApiKey } from '@/lib/voice/read-env';
import {
  ensureVoiceConnectionConfigured,
  getActiveVoiceConnectionId,
} from '@/lib/voice/configure-connection';

const VOICE_API = 'https://api.telnyx.com/v2';

async function tagProviderNumber(
  telnyxNumberId: string,
  userId: string,
  email: string,
): Promise<void> {
  const apiKey = readVoiceApiKey();
  if (!apiKey) return;

  try {
    await fetch(`${VOICE_API}/phone_numbers/${telnyxNumberId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: [`user:${userId}`, `email:${email}`],
      }),
    });
  } catch (err) {
    console.error('[INBOUND-PREPARE] tag failed:', err);
  }
}

export interface PrepareInboundResult {
  numbers_total: number;
  phones_normalized: number;
  ids_backfilled: number;
  routing_activated: number;
  workspace_linked: number;
  credential_ready: boolean;
  primary_routed: boolean;
  connection_configured: boolean;
  message: string;
}

/**
 * One-shot repair for legacy accounts: normalize DB phones, backfill provider IDs,
 * link workspace, tag numbers, assign voice connection, ensure browser credential.
 */
export async function prepareInboundAccount(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<PrepareInboundResult> {
  const [connectionId, connectionConfig] = await Promise.all([
    getActiveVoiceConnectionId(),
    ensureVoiceConnectionConfigured(),
  ]);
  const workspaceId = await resolveUserWorkspaceId(supabase, userId);

  const { data: rows } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, is_default, workspace_id, status')
    .eq('user_id', userId)
    .neq('status', 'released');

  const numbers: DbNumberRow[] = (rows ?? []).map((n) => ({
    id: n.id as string,
    phone_number: n.phone_number as string,
    telnyx_number_id: n.telnyx_number_id as string | null,
    is_default: Boolean(n.is_default),
  }));

  let phonesNormalized = 0;
  let workspaceLinked = 0;
  let idsBackfilled = 0;

  const providerIndex = await fetchProviderPhoneIndex();

  for (const row of rows ?? []) {
    const canonical = normalizeE164(row.phone_number as string);
    if (canonical && canonical !== row.phone_number) {
      await supabase
        .from('purchased_numbers')
        .update({ phone_number: canonical })
        .eq('id', row.id);
      phonesNormalized++;
      const num = numbers.find((n) => n.id === row.id);
      if (num) num.phone_number = canonical;
    }

    if (!row.workspace_id && workspaceId) {
      await supabase
        .from('purchased_numbers')
        .update({ workspace_id: workspaceId })
        .eq('id', row.id);
      workspaceLinked++;
    }

    const provider = lookupProviderPhone(providerIndex, canonical || (row.phone_number as string));
    if (provider?.id) {
      if (!row.telnyx_number_id) {
        await supabase
          .from('purchased_numbers')
          .update({ telnyx_number_id: provider.id })
          .eq('id', row.id);
        idsBackfilled++;
        const num = numbers.find((n) => n.id === row.id);
        if (num) num.telnyx_number_id = provider.id;
      }
      void tagProviderNumber(provider.id, userId, userEmail);
    }
  }

  await backfillProviderIds(supabase, numbers, providerIndex);

  let routingActivated = 0;
  if (connectionId) {
    const audit = await auditNumberRouting(numbers, connectionId, providerIndex);
    if (audit.needs_activation) {
      const result = await activateRoutingForNumbers(numbers, connectionId, providerIndex);
      routingActivated = result.activated;
    }

    const primary = numbers.find((n) => n.is_default) ?? numbers[0];
    if (primary) {
      const provider = lookupProviderPhone(providerIndex, primary.phone_number);
      const providerId = primary.telnyx_number_id ?? provider?.id;
      if (providerId && provider && !connectionsMatch(provider.connection_id, connectionId)) {
        const ok = await assignNumberToVoiceConnection(providerId);
        if (ok) routingActivated++;
      }
    }
  }

  const credentialId = connectionId
    ? await resolveActiveCredentialId(supabase, userId)
    : null;

  const afterAudit = connectionId
    ? await auditNumberRouting(numbers, connectionId, providerIndex)
    : { primary_routed: false, needs_activation: numbers.length > 0 };

  const message =
    afterAudit.primary_routed
      ? 'Your inbound line is configured and ready.'
      : routingActivated > 0
        ? 'Numbers linked — your line should be ready momentarily.'
        : numbers.length === 0
          ? 'Add a phone number to receive inbound calls.'
          : 'We refreshed your line setup — try a test call.';

  return {
    numbers_total: numbers.length,
    phones_normalized: phonesNormalized,
    ids_backfilled: idsBackfilled,
    routing_activated: routingActivated,
    workspace_linked: workspaceLinked,
    credential_ready: Boolean(credentialId),
    primary_routed: afterAudit.primary_routed,
    connection_configured: connectionConfig.ok,
    message: connectionConfig.ok
      ? message
      : connectionConfig.env_mismatch
        ? 'Voice connection ID mismatch detected — latest deploy auto-resolves from your browser credential. Refresh after deploy completes.'
        : connectionConfig.message,
  };
}
