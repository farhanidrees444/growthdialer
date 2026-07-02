import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { readMessagingProfileId } from '@/lib/telephony/telnyx/env';
import type { WorkspaceTenDlcCampaignProfile } from '@/lib/compliance/ten-dlc-profile';

export const DEFAULT_SMS_OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'] as const;

export interface WorkspaceMessagingProfileRow {
  workspace_id: string;
  legal_business_name: string | null;
  brand_status: string;
  campaign_status: string;
  campaign_id: string | null;
  messaging_profile_id: string | null;
  opt_out_keywords: string[] | null;
  daily_volume_cap: number | null;
  use_case: string;
  sample_messages: unknown;
  opt_in_description: string | null;
}

export function isMessagingServiceConfigured(): boolean {
  return Boolean(readMessagingProfileId());
}

export function isSmsOptOutKeyword(
  body: string,
  keywords: readonly string[] = DEFAULT_SMS_OPT_OUT_KEYWORDS,
): boolean {
  const normalized = body.trim().toUpperCase();
  return keywords.some((kw) => normalized === kw.toUpperCase());
}

export async function getWorkspaceMessagingProfile(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceMessagingProfileRow | null> {
  const { data } = await supabase
    .from('workspace_messaging_profiles')
    .select(
      'workspace_id, legal_business_name, brand_status, campaign_status, campaign_id, messaging_profile_id, opt_out_keywords, daily_volume_cap, use_case, sample_messages, opt_in_description',
    )
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  return (data as WorkspaceMessagingProfileRow | null) ?? null;
}

export function isCampaignActiveForSms(profile: WorkspaceMessagingProfileRow | null): boolean {
  if (!profile) return false;
  return profile.brand_status === 'approved' && profile.campaign_status === 'active';
}

export async function countOutboundSmsToday(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('sms_messages')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('direction', 'outbound')
    .gte('created_at', start.toISOString());

  return count ?? 0;
}

export type SmsGateBlock =
  | { ok: true; profile: WorkspaceMessagingProfileRow | null; messagingProfileId: string }
  | { ok: false; error: string; status: number };

export async function checkWorkspaceSmsGate(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SmsGateBlock> {
  const messagingProfileId =
    (await getWorkspaceMessagingProfile(supabase, workspaceId))?.messaging_profile_id?.trim()
    || readMessagingProfileId();

  if (!messagingProfileId) {
    return {
      ok: false,
      status: 503,
      error: 'Messaging is not configured for this environment',
    };
  }

  const profile = await getWorkspaceMessagingProfile(supabase, workspaceId);
  if (!isCampaignActiveForSms(profile)) {
    return {
      ok: false,
      status: 403,
      error: 'SMS is locked until 10DLC brand and campaign are approved. Complete registration in Settings → Messaging compliance.',
    };
  }

  if (profile?.daily_volume_cap && profile.daily_volume_cap > 0) {
    const sentToday = await countOutboundSmsToday(supabase, workspaceId);
    if (sentToday >= profile.daily_volume_cap) {
      return {
        ok: false,
        status: 429,
        error: `Daily SMS cap reached (${profile.daily_volume_cap}). Try again tomorrow or raise your campaign limit.`,
      };
    }
  }

  return { ok: true, profile, messagingProfileId };
}

export async function assertWorkspaceCanSendSms(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<NextResponse | null> {
  const gate = await checkWorkspaceSmsGate(supabase, workspaceId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, code: 'sms_gate_blocked' }, { status: gate.status });
  }
  return null;
}

export async function isPhoneSmsOptedOut(
  supabase: SupabaseClient,
  workspaceId: string,
  phoneE164: string,
): Promise<boolean> {
  const { data: optOut } = await supabase
    .from('sms_opt_outs')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('phone_e164', phoneE164)
    .maybeSingle();

  if (optOut?.id) return true;

  const { data: lead } = await supabase
    .from('leads')
    .select('id, sms_opt_out, dnc')
    .eq('workspace_id', workspaceId)
    .eq('phone', phoneE164)
    .maybeSingle();

  return Boolean(lead?.sms_opt_out || lead?.dnc);
}

export async function recordSmsOptOut(
  supabase: SupabaseClient,
  workspaceId: string,
  phoneE164: string,
  source: 'keyword' | 'manual' | 'import' | 'api' = 'keyword',
): Promise<void> {
  await supabase.from('sms_opt_outs').upsert({
    workspace_id: workspaceId,
    phone_e164: phoneE164,
    source,
    opted_out_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,phone_e164' });

  await supabase
    .from('leads')
    .update({ sms_opt_out: true, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('phone', phoneE164);
}

export function toCampaignProfileSnapshot(
  row: WorkspaceMessagingProfileRow | null,
): Partial<WorkspaceTenDlcCampaignProfile> | null {
  if (!row) return null;
  return {
    workspace_id: row.workspace_id,
    campaign_id: row.campaign_id,
    use_case: row.use_case as WorkspaceTenDlcCampaignProfile['use_case'],
    sample_messages: Array.isArray(row.sample_messages)
      ? (row.sample_messages as string[])
      : [],
    opt_in_description: row.opt_in_description ?? '',
    opt_out_keywords: row.opt_out_keywords ?? [...DEFAULT_SMS_OPT_OUT_KEYWORDS],
    status: row.campaign_status as WorkspaceTenDlcCampaignProfile['status'],
    daily_volume_cap: row.daily_volume_cap,
  };
}
