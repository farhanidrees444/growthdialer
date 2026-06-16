import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { acceptInboundCall } from '@/lib/inbound/inbound-accept-call';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { call_control_id?: string };
    const callControlId = body.call_control_id?.trim();
    if (!callControlId) {
      return NextResponse.json({ error: 'call_control_id is required' }, { status: 400 });
    }

    const { data: call } = await supabase
      .from('calls')
      .select('id, user_id, workspace_id, direction, status')
      .eq('telnyx_call_id', callControlId)
      .eq('direction', 'inbound')
      .maybeSingle();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (call.user_id !== user.id && call.workspace_id !== access.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const result = await acceptInboundCall(service, {
      callId: call.id,
      callControlId,
      userId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Accept failed' }, { status: 503 });
    }

    await logInboundCallStep(service, callControlId, 'connecting');

    return NextResponse.json({
      ok: true,
      call_id: call.id,
      webrtc_leg_id: result.webrtc_leg_id ?? null,
    });
  } catch (err) {
    console.error('[CALLS/ACCEPT]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
