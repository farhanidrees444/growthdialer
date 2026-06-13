import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceOutboundTrustContext, StirAttestationLevel } from '@/lib/compliance/ten-dlc-profile';

const DEFAULT_DISPLAY = 'GrowthDialer';

/**
 * Resolve outbound caller presentation for a workspace.
 * Reads workspace name today; 10DLC profile columns can extend this without API changes.
 */
export async function resolveWorkspaceOutboundTrust(
  supabase: SupabaseClient,
  workspaceId: string,
  fromNumberE164: string,
): Promise<WorkspaceOutboundTrustContext> {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, settings')
    .eq('id', workspaceId)
    .maybeSingle();

  const settings = (workspace?.settings ?? {}) as Record<string, unknown>;
  const displayName =
    (typeof settings.cnam_display_name === 'string' ? settings.cnam_display_name.trim() : '')
    || (workspace?.name as string | null)?.trim()
    || DEFAULT_DISPLAY;

  const { data: numberRow } = await supabase
    .from('purchased_numbers')
    .select('phone_number, status')
    .eq('workspace_id', workspaceId)
    .eq('phone_number', fromNumberE164)
    .neq('status', 'released')
    .maybeSingle();

  const hasVerifiedDid = Boolean(numberRow);
  const stir: StirAttestationLevel = hasVerifiedDid ? 'A' : 'none';

  return {
    workspace_id: workspaceId,
    from_display_name: displayName.slice(0, 15),
    stir_attestation: stir,
    ten_dlc_campaign_id: null,
    cnam_registered: hasVerifiedDid,
    trust_tier: hasVerifiedDid ? 'standard' : 'unverified',
  };
}
