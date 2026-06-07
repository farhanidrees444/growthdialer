import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hangupCall } from '@/lib/telnyx';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { emitCallWebhooks } from '@/lib/webhooks/outgoing';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { call_control_id } = body as { call_control_id: string };
    if (!call_control_id) {
      return NextResponse.json({ error: 'Missing call_control_id' }, { status: 400 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const callRow = await requireCallAccess(
      supabase,
      { telnyxCallId: call_control_id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(callRow)) return callRow;

    await hangupCall(call_control_id);

    const endedAt = new Date().toISOString();
    try {
      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: endedAt })
        .eq('id', callRow.id);
    } catch (dbError) {
      console.error('Failed to update call status on hangup:', dbError);
    }

    emitCallWebhooks(callRow.user_id, ['call_completed'], {
      call_id: callRow.id,
      workspace_id: access.workspaceId,
      lead_id: callRow.lead_id ?? null,
      disposition: callRow.disposition ?? null,
    });

    return NextResponse.json({ success: true, call_control_id });
  } catch (error) {
    console.error('Hangup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to hang up call' },
      { status: 500 },
    );
  }
}
