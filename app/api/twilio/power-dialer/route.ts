import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { assertWorkspaceCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import { parseJsonBody } from '@/lib/api/errors';
import { z } from 'zod';
import { normalizePhone } from '@/lib/phone';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveCallerIdForLead } from '@/lib/dialer/resolve-caller-id';
import { createTwilioOutboundCall } from '@/lib/twilio/outbound-call';
import { isTwilioProvider } from '@/lib/voice/provider';

const powerDialSchema = z.object({
  session_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  phone: z.string().min(7),
  caller_id: z.string().optional(),
});

/**
 * POST /api/twilio/power-dialer
 * REST-originate next power-dial lead; bridges to agent browser client on answer.
 */
export async function POST(request: NextRequest) {
  if (!isTwilioProvider()) {
    return NextResponse.json({ error: 'Power REST dial requires Twilio provider' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, powerDialSchema);
    if (!parsed.ok) return parsed.response;
    const { session_id, lead_id, phone, caller_id } = parsed.data;

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body: rawBody });
    if (isWorkspaceError(access)) return access;
    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const billingBlock = await assertWorkspaceCanPlaceCalls(supabase, access.workspaceId);
    if (billingBlock) return billingBlock;

    const { data: session } = await supabase
      .from('power_dial_sessions')
      .select('id, status')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status === 'paused') {
      return NextResponse.json({ error: 'Session is paused' }, { status: 409 });
    }
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session not active' }, { status: 400 });
    }

    const e164 = normalizePhone(phone) ?? normalizeE164(phone);
    if (!e164) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    let fromNumber = caller_id?.trim() ?? '';
    if (!fromNumber) {
      const resolved = await resolveCallerIdForLead(supabase, user.id, e164);
      fromNumber = resolved.fromNumber ?? '';
    }
    if (!fromNumber) {
      return NextResponse.json({ error: 'No caller ID configured' }, { status: 422 });
    }

    const { callSid } = await createTwilioOutboundCall({
      to: e164,
      from: fromNumber,
      userId: user.id,
      machineDetection: true,
      extraQuery: {
        gd_power_session_id: session_id,
        ...(lead_id ? { gd_lead_id: lead_id } : {}),
      },
    });

    const nowIso = new Date().toISOString();
    const { data: callRow } = await supabase
      .from('calls')
      .insert({
        user_id: user.id,
        workspace_id: access.workspaceId,
        lead_id: lead_id ?? null,
        direction: 'outbound',
        to_number: e164,
        from_number: fromNumber,
        telnyx_call_id: callSid,
        status: 'initiated',
        started_at: nowIso,
        created_at: nowIso,
        power_dial_session_id: session_id,
      })
      .select('id')
      .single();

    return NextResponse.json({
      call_sid: callSid,
      call_control_id: callSid,
      db_id: callRow?.id ?? null,
      to: e164,
      status: 'initiated',
    });
  } catch (err) {
    console.error('[twilio/power-dialer]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dial failed' },
      { status: 500 },
    );
  }
}
