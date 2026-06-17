import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';

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

/** Normalize numbers and link workspace — Twilio routes via purchased_numbers + Client identity. */
export async function prepareInboundAccount(
  supabase: SupabaseClient,
  _userId: string,
  _userEmail: string,
): Promise<PrepareInboundResult> {
  const userId = _userId;
  const workspaceId = await resolveUserWorkspaceId(supabase, userId);

  const { data: rows } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, is_default, workspace_id, status')
    .eq('user_id', userId)
    .neq('status', 'released');

  let phonesNormalized = 0;
  let workspaceLinked = 0;

  for (const row of rows ?? []) {
    const canonical = normalizeE164(row.phone_number as string);
    if (canonical && canonical !== row.phone_number) {
      await supabase
        .from('purchased_numbers')
        .update({ phone_number: canonical })
        .eq('id', row.id);
      phonesNormalized++;
    }
    if (!row.workspace_id && workspaceId) {
      await supabase
        .from('purchased_numbers')
        .update({ workspace_id: workspaceId })
        .eq('id', row.id);
      workspaceLinked++;
    }
  }

  const numbersTotal = rows?.length ?? 0;
  const hasDefault = (rows ?? []).some((r) => r.is_default && r.status === 'active');

  return {
    numbers_total: numbersTotal,
    phones_normalized: phonesNormalized,
    ids_backfilled: 0,
    routing_activated: 0,
    workspace_linked: workspaceLinked,
    credential_ready: true,
    primary_routed: numbersTotal > 0 && hasDefault,
    connection_configured: true,
    message:
      numbersTotal === 0
        ? 'Contact support to assign a voice line to your account.'
        : 'Your inbound line is configured and ready.',
  };
}
