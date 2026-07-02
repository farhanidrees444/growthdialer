import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import {
  checkWorkspaceSmsGate,
  getWorkspaceMessagingProfile,
  isMessagingServiceConfigured,
  toCampaignProfileSnapshot,
} from '@/lib/compliance/sms-gate';
import { isMessagingConfigured } from '@/lib/telephony/telnyx/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const profile = await getWorkspaceMessagingProfile(supabase, access.workspaceId);
  const gate = await checkWorkspaceSmsGate(supabase, access.workspaceId);

  return NextResponse.json({
    env_configured: isMessagingConfigured(),
    service_configured: isMessagingServiceConfigured(),
    can_send_sms: gate.ok,
    gate_error: gate.ok ? null : gate.error,
    profile: profile ?? {
      workspace_id: access.workspaceId,
      brand_status: 'draft',
      campaign_status: 'draft',
      use_case: 'sales_outbound',
      sample_messages: [],
      opt_in_description: null,
      opt_out_keywords: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
    },
    campaign: toCampaignProfileSnapshot(profile),
    next_steps: gate.ok
      ? ['SMS is enabled for this workspace.']
      : [
          'Register your 10DLC brand and campaign in the messaging provider portal.',
          'Set brand_status=approved and campaign_status=active on this workspace profile.',
          'Link your purchased numbers to the messaging profile.',
        ],
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'WORKSPACE_EDIT')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    workspace_id: access.workspaceId,
    updated_at: new Date().toISOString(),
  };

  const stringFields = [
    'legal_business_name',
    'ein_or_tax_id',
    'brand_id',
    'campaign_id',
    'messaging_profile_id',
    'opt_in_description',
    'use_case',
  ] as const;

  for (const key of stringFields) {
    if (typeof body[key] === 'string') patch[key] = body[key];
  }

  if (typeof body.brand_status === 'string') patch.brand_status = body.brand_status;
  if (typeof body.campaign_status === 'string') patch.campaign_status = body.campaign_status;
  if (Array.isArray(body.sample_messages)) {
    patch.sample_messages = body.sample_messages.filter((m) => typeof m === 'string').slice(0, 5);
  }
  if (Array.isArray(body.opt_out_keywords)) {
    patch.opt_out_keywords = body.opt_out_keywords
      .filter((m) => typeof m === 'string')
      .map((m) => m.toUpperCase())
      .slice(0, 10);
  }
  if (typeof body.daily_volume_cap === 'number' && body.daily_volume_cap > 0) {
    patch.daily_volume_cap = Math.round(body.daily_volume_cap);
  }

  if (body.mark_submitted === true) {
    patch.brand_status = 'submitted';
    patch.campaign_status = 'pending_carrier';
    patch.submitted_at = new Date().toISOString();
  }

  if (body.mark_active === true) {
    patch.brand_status = 'approved';
    patch.campaign_status = 'active';
    patch.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('workspace_messaging_profiles')
    .upsert(patch, { onConflict: 'workspace_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
