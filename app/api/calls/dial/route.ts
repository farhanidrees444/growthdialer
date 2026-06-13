import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import telnyxClient, { toE164 } from '@/lib/telnyx';
import { normalizePhone } from '@/lib/phone';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { assertWorkspaceCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { dialRequestSchema } from '@/lib/validations';
import { resolveCallerIdForLead } from '@/lib/dialer/resolve-caller-id';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { resolveWorkspaceOutboundTrust } from '@/lib/compliance/workspace-trust';
import { buildOutboundDialPayload } from '@/lib/voice/outbound-dial-payload';

export async function POST(request: NextRequest) {
  try {
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

    const e164 = normalizePhone(to) ?? toE164(to);
    console.log(`[dial] original="${to}" normalized="${e164}" webrtc=${!!call_control_id}`);
    if (!e164) {
      return NextResponse.json({ error: 'Phone number format is invalid' }, { status: 400 });
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

    // ── WebRTC mode: browser already dialed via SDK ──────────────────────────
    // call_control_id comes from the TelnyxRTC newCall() return value.
    // We just persist the DB record here; Telnyx webhooks update status.
    // Returns db_id (UUID) so the client can use it for notes/disposition APIs.
    if (call_control_id) {
      let dbId: string | null = null;
      const nowIso = new Date().toISOString();
      const { data: insertedRow, error: insertError } = await supabase
        .from('calls')
        .insert({
          user_id: userId,
          workspace_id: access.workspaceId,
          lead_id: lead_id ?? null,
          direction: 'outbound',
          to_number: e164,
          from_number: fromNumber,
          telnyx_call_id: call_control_id,
          status: 'initiated',
          started_at: nowIso,
          created_at: nowIso,
        })
        .select('id')
        .single();
      if (insertError) console.error('[dial] insert error:', insertError);
      dbId = insertedRow?.id ?? null;
      return NextResponse.json({ call_control_id, db_id: dbId, to: e164, status: 'initiated' });
    }

    // ── Server-side dial (legacy / fallback when WebRTC unavailable) ─────────
    const { resolveVoiceWebhookUrl } = await import('@/lib/voice/webhook-url');
    const webhookUrl = resolveVoiceWebhookUrl();
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
    }

    const callControlAppId = await getActiveCallControlAppId();
    if (!callControlAppId) {
      return NextResponse.json({ error: 'Voice dial application is not configured' }, { status: 503 });
    }

    console.log(`[dial] server-side: to=${e164} from=${fromNumber}`);
    const trust = await resolveWorkspaceOutboundTrust(supabase, access.workspaceId, fromNumber);
    const dialBody = buildOutboundDialPayload({
      connectionId: callControlAppId,
      to: e164,
      from: fromNumber,
      webhookUrl,
      trust,
      amd: 'disabled',
      timeoutSecs: 30,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (telnyxClient.calls.dial as any)(dialBody);

    const newCallControlId = result.data?.call_control_id;

    if (newCallControlId) {
      const nowIso = new Date().toISOString();
      const { error: insertError } = await supabase.from('calls').insert({
        user_id: userId,
        workspace_id: access.workspaceId,
        lead_id: lead_id ?? null,
        direction: 'outbound',
        to_number: e164,
        from_number: fromNumber,
        telnyx_call_id: newCallControlId,
        status: 'initiated',
        started_at: nowIso,
        created_at: nowIso,
      });
      if (insertError) console.error('[dial] insert error:', insertError);
    }

    return NextResponse.json({
      call_control_id: newCallControlId,
      to: e164,
      status: 'initiated',
    });
  } catch (error) {
    console.error('[dial] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Call could not be connected' },
      { status: 500 },
    );
  }
}
