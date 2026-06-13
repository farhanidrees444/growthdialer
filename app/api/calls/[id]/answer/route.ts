import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { ringBrowserForInbound } from '@/lib/inbound/bridge-to-browser';
import { stopInboundHoldPlayback } from '@/lib/inbound/hold-playback';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import { voiceServerLog } from '@/lib/debug/voice-server-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(call)) return call;

    if (call.direction === 'inbound' && call.status && !['ringing', 'in_progress'].includes(call.status)) {
      return NextResponse.json({ error: 'Call is no longer answerable' }, { status: 409 });
    }

    if (call.direction === 'inbound') {
      if (!call.telnyx_call_id || !call.to_number) {
        return NextResponse.json({ error: 'Missing PSTN leg metadata' }, { status: 422 });
      }

      const service = createServiceClient();
      if (!service) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      await stopInboundHoldPlayback(call.telnyx_call_id);
      await logInboundCallStep(service, call.telnyx_call_id, 'leg_a_playback_stopped');
      await logInboundCallStep(service, call.telnyx_call_id, 'agent_accepted');

      const dialResult = await ringBrowserForInbound(
        service,
        user.id,
        call.telnyx_call_id,
        call.to_number,
        call.from_number ?? '',
        call.id,
      );

      if (!dialResult.ok) {
        await logInboundCallStep(service, call.telnyx_call_id, 'leg_b_dialed', {
          telnyx_status: 'error',
          error_message: 'Leg B dial failed',
        });
        return NextResponse.json({ error: 'Could not reach your browser line' }, { status: 503 });
      }

      await logInboundCallStep(service, call.telnyx_call_id, 'leg_b_dialed', {
        telnyx_status: 'ok',
      });

      voiceServerLog({
        location: 'answer:inbound2leg',
        message: 'accept — hold stopped, Leg B dialed; bridge deferred to WebRTC answer',
        data: { callId: id, webrtcLegId: dialResult.webrtc_leg_id ?? null },
        hypothesisId: 'H-2LEG',
        runId: 'run10',
      });

      return NextResponse.json({
        success: true,
        webrtc_leg_id: dialResult.webrtc_leg_id ?? null,
        bridged: false,
      });
    }

    await supabase
      .from('calls')
      .update({ status: 'in_progress', answered_at: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['ringing', 'in_progress']);

    console.log('[ANSWER] Outbound call answered:', id);
    return NextResponse.json({ success: true, bridged: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
