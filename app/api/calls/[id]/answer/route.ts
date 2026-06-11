import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { completeInboundBridge } from '@/lib/inbound/bridge-to-browser';

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

    let bridged = call.status === 'in_progress' && Boolean(call.answered_at);
    const webrtcLegId =
      (call as { telnyx_webrtc_leg_id?: string | null }).telnyx_webrtc_leg_id
      ?? (
        call.telnyx_session_id
        && call.telnyx_call_id
        && call.telnyx_session_id !== call.telnyx_call_id
          ? call.telnyx_session_id
          : null
      );
    if (
      !bridged
      && call.direction === 'inbound'
      && call.status === 'ringing'
      && call.telnyx_call_id
      && webrtcLegId
    ) {
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 400 : 700));
        bridged = await completeInboundBridge(call.telnyx_call_id, webrtcLegId);
        if (bridged) break;
      }
      if (!bridged) {
        console.warn('[ANSWER] Bridge backup did not complete after retries — check voice API key and connection');
      }
    }

    console.log('[ANSWER] Inbound call answered:', id, '| bridged:', bridged);
    return NextResponse.json({ success: true, bridged });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
