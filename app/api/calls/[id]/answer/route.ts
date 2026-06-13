import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { completeInboundBridge } from '@/lib/inbound/bridge-to-browser';
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

    await supabase
      .from('calls')
      .update({ status: 'in_progress', answered_at: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['ringing', 'in_progress']);

    // Inbound browser legs use bridge_on_answer — Telnyx bridges when the SDK answers.
    // Do NOT call completeInboundBridge on inbound accept; premature PSTN bridge kills the ringing invite.
    let bridged = true;
    if (
      call.direction === 'inbound'
      && call.telnyx_call_id
      && call.telnyx_webrtc_leg_id
    ) {
      voiceServerLog({
        location: 'answer:deferredBridge',
        message: 'REST answer recorded — bridge deferred to WebRTC answer (bridge_on_answer)',
        data: { callId: id, webrtcLegId: call.telnyx_webrtc_leg_id },
        hypothesisId: 'H-K',
        runId: 'run8',
      });
    } else if (call.telnyx_call_id && call.telnyx_webrtc_leg_id) {
      bridged = await completeInboundBridge(
        call.telnyx_call_id,
        call.telnyx_webrtc_leg_id,
      );
    }

    console.log('[ANSWER] Inbound call answered:', id, '| bridged:', bridged);
    voiceServerLog({
      location: 'answer:complete',
      message: 'REST answer handled',
      data: { callId: id, bridged, direction: call.direction, webrtcLegId: call.telnyx_webrtc_leg_id },
      hypothesisId: 'H-C,H-D',
    });
    return NextResponse.json({ success: true, bridged });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
