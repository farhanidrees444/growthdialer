import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { emitCallWebhooks } from '@/lib/webhooks/outgoing';
import { createServiceClient } from '@/lib/supabase/service';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import { isProviderCallId } from '@/lib/voice/extract-call-id';
import { hangupVoiceCall } from '@/lib/voice/hangup-call';

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
        await logInboundCallStep(service, controlId, 'agent_declined');
      }
      if (call.telnyx_webrtc_leg_id && isProviderCallId(call.telnyx_webrtc_leg_id)) {
        await hangupVoiceCall(call.telnyx_webrtc_leg_id).catch(() => {
          /* browser leg may already be gone */
        });
      }
      skipHangup = false;
    }

    if (!skipHangup) {
      if (isProviderCallId(controlId)) {
        await hangupVoiceCall(controlId).catch((err) => {
          console.warn('[CALL-END] Voice hangup skipped:', err);
        });
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
