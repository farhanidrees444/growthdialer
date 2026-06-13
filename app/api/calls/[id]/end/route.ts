import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { emitCallWebhooks } from '@/lib/webhooks/outgoing';
import { stopInboundHoldPlayback } from '@/lib/inbound/hold-playback';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import { createServiceClient } from '@/lib/supabase/service';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import { DIAL_PENDING } from '@/lib/inbound/bridge-to-browser';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id: callControlId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const call = await requireCallAccess(
    supabase,
    { id: callControlId, telnyxCallId: callControlId },
    access,
    user.id,
    'control',
  );
  if (isCallAccessError(call)) return call;

  const controlId = call.telnyx_call_id ?? callControlId;

  let skipHangup = false;
  let declined = false;
  try {
    const body = await request.json() as { skip_hangup?: boolean; declined?: boolean };
    skipHangup = Boolean(body?.skip_hangup);
    declined = Boolean(body?.declined);
  } catch {
    /* empty body */
  }

  try {
    const isInboundDecline =
      call.direction === 'inbound'
      && !call.answered_at
      && ['ringing', 'in_progress'].includes(call.status ?? 'ringing');

    if (isInboundDecline) {
      const service = createServiceClient();
      if (service && controlId) {
        await stopInboundHoldPlayback(controlId);
        await logInboundCallStep(service, controlId, 'leg_a_playback_stopped');
        await logInboundCallStep(service, controlId, 'agent_declined');
      }
      if (call.telnyx_webrtc_leg_id && call.telnyx_webrtc_leg_id !== DIAL_PENDING) {
        await telnyxCallAction(call.telnyx_webrtc_leg_id, 'hangup');
      }
      skipHangup = false;
    }

    if (!skipHangup) {
      const res = await fetch(
        `https://api.telnyx.com/v2/calls/${encodeURIComponent(controlId)}/actions/hangup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok && res.status !== 404) {
        const err = await res.json().catch(() => ({}));
        const detail = (err as { errors?: { detail?: string }[] }).errors?.[0]?.detail ?? 'Hangup failed';
        console.error('[CALL-END] Telnyx error:', detail);
        return NextResponse.json({ error: detail }, { status: 500 });
      }
    }

    const isInboundDeclineFinal =
      call.direction === 'inbound'
      && !call.answered_at
      && (declined || ['ringing', 'in_progress'].includes(call.status ?? 'ringing'));

    await supabase
      .from('calls')
      .update({
        status: isInboundDeclineFinal ? 'missed' : 'completed',
        disposition: isInboundDeclineFinal ? 'missed' : call.disposition,
        ended_at: new Date().toISOString(),
      })
      .eq('id', call.id);

    emitCallWebhooks(call.user_id, ['call_completed'], {
      call_id: call.id,
      workspace_id: access.workspaceId,
      lead_id: call.lead_id ?? null,
      disposition: call.disposition ?? null,
    });

    console.log('[CALL-END] Success — call:', call.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'End call failed';
    console.error('[CALL-END] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
