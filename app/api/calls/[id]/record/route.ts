import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { getTelephonyProvider } from '@/lib/telephony';
import { resolveRecordableControlId } from '@/lib/telephony/telnyx/recording';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id: callId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { action?: string };
  const { action } = body;
  if (action !== 'record_start' && action !== 'record_stop') {
    return NextResponse.json({ error: 'action must be record_start or record_stop' }, { status: 400 });
  }

  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const call = await requireCallAccess(
    supabase,
    { id: callId, telnyxCallId: callId },
    access,
    user.id,
    'control',
  );
  if (isCallAccessError(call)) return call;

  const provider = getTelephonyProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  const callControlId = resolveRecordableControlId(call);
  if (!callControlId) {
    return NextResponse.json({ error: 'Call is not connected yet' }, { status: 409 });
  }

  try {
    if (action === 'record_start') {
      await provider.startRecording(callControlId, call.id);
      return NextResponse.json({ ok: true, action, message: 'Recording started' });
    }

    await provider.stopRecording(callControlId);
    return NextResponse.json({ ok: true, action, message: 'Recording stopped' });
  } catch (error) {
    console.error('[calls/record]', error);
    return NextResponse.json(
      { error: 'Recording could not be updated for this call' },
      { status: 502 },
    );
  }
}
