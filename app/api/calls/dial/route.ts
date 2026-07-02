import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';
import { normalizeE164 } from '@/lib/inbound/phone';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { assertWorkspaceCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { dialRequestSchema } from '@/lib/validations';
import { resolveCallerIdForLead } from '@/lib/dialer/resolve-caller-id';
import { getTelephonyProvider } from '@/lib/telephony';

export async function POST(request: NextRequest) {
  try {
    const provider = getTelephonyProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return apiUnauthorized();
    }

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, dialRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { to, lead_id, call_control_id } = parsed.data;

    const e164 = normalizePhone(to) ?? normalizeE164(to);
    if (!e164) {
      return NextResponse.json({ error: 'Phone number format is invalid' }, { status: 400 });
    }

    if (!call_control_id) {
      return NextResponse.json(
        { error: 'Place calls from the browser dialer — voice session id is required.' },
        { status: 422 },
      );
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId, { body: rawBody });
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const billingBlock = await assertWorkspaceCanPlaceCalls(supabase, access.workspaceId);
    if (billingBlock) return billingBlock;

    let leadPhone: string | null = null;
    if (lead_id) {
      const { data: leadRow } = await supabase
        .from('leads')
        .select('phone')
        .eq('id', lead_id)
        .eq('workspace_id', access.workspaceId)
        .maybeSingle();
      leadPhone = leadRow?.phone ?? null;
    }

    const { fromNumber } = await resolveCallerIdForLead(supabase, userId, leadPhone ?? to);
    if (!fromNumber) {
      return NextResponse.json(
        { error: 'No active caller ID — contact support to assign a voice line.' },
        { status: 422 },
      );
    }

    const nowIso = new Date().toISOString();
    const row = {
      user_id: userId,
      workspace_id: access.workspaceId,
      lead_id: lead_id ?? null,
      direction: 'outbound' as const,
      to_number: e164,
      from_number: fromNumber,
      telnyx_call_id: call_control_id,
      status: 'initiated',
      started_at: nowIso,
      created_at: nowIso,
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('calls')
      .insert(row)
      .select('id')
      .single();

    let dbId: string | null = insertedRow?.id ?? null;

    if (insertError) {
      const { data: existing } = await supabase
        .from('calls')
        .select('id, user_id, workspace_id')
        .eq('telnyx_call_id', call_control_id)
        .maybeSingle();

      if (existing?.id) {
        const { data: repaired } = await supabase
          .from('calls')
          .update({
            user_id: existing.user_id ?? userId,
            workspace_id: existing.workspace_id ?? access.workspaceId,
            lead_id: lead_id ?? null,
            direction: 'outbound',
            to_number: e164,
            from_number: fromNumber,
            status: 'initiated',
            started_at: nowIso,
          })
          .eq('id', existing.id)
          .select('id')
          .single();
        dbId = repaired?.id ?? existing.id;
      } else {
        console.error('[dial] insert error:', insertError);
      }
    }

    return NextResponse.json({ call_control_id, db_id: dbId, to: e164, status: 'initiated' });
  } catch (error) {
    console.error('[dial] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Call could not be connected' },
      { status: 500 },
    );
  }
}
