import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';
import { normalizeE164 } from '@/lib/inbound/phone';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { smsSendSchema } from '@/lib/validations';
import { resolveCallerIdForLead } from '@/lib/dialer/resolve-caller-id';
import { getTelephonyProvider } from '@/lib/telephony';
import { SmsSendBlockedError } from '@/lib/telephony/telnyx/sms';
import { isMessagingConfigured } from '@/lib/telephony/telnyx/env';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isMessagingConfigured()) {
      return NextResponse.json({ error: 'Messaging is not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, smsSendSchema);
    if (!parsed.ok) return parsed.response;

    const { to, body, lead_id, from } = parsed.data;
    const e164 = normalizePhone(to) ?? normalizeE164(to);
    if (!e164) {
      return NextResponse.json({ error: 'Phone number format is invalid' }, { status: 400 });
    }

    const userId = user.id;
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body: rawBody });
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'SEND_SMS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let leadPhone: string | null = null;
    if (lead_id) {
      const { data: leadRow } = await supabase
        .from('leads')
        .select('phone, sms_opt_out, dnc')
        .eq('id', lead_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!leadRow) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      if (leadRow.sms_opt_out || leadRow.dnc) {
        return NextResponse.json({ error: 'Lead has opted out of SMS' }, { status: 403 });
      }
      leadPhone = leadRow.phone ?? null;
    }

    const fromExplicit = from ? (normalizePhone(from) ?? normalizeE164(from)) : null;
    const { fromNumber } = fromExplicit
      ? { fromNumber: fromExplicit }
      : await resolveCallerIdForLead(supabase, user.id, leadPhone ?? e164);

    if (!fromNumber) {
      return NextResponse.json(
        { error: 'No SMS-enabled caller ID — assign a voice line to this workspace first.' },
        { status: 422 },
      );
    }

    const provider = getTelephonyProvider();
    const handle = await provider.sendSMS({
      tenantId: userId,
      agentId: user.id,
      to: e164,
      from: fromNumber,
      body,
      leadId: lead_id ?? null,
    });

    return NextResponse.json({
      ok: true,
      message_id: handle.messageId,
      db_message_id: handle.dbMessageId,
      status: handle.status,
      to: e164,
      from: fromNumber,
    });
  } catch (error) {
    if (error instanceof SmsSendBlockedError) {
      return NextResponse.json({ error: error.message, code: 'sms_gate_blocked' }, { status: error.status });
    }
    console.error('[api/sms/send]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Message could not be sent' },
      { status: 502 },
    );
  }
}
