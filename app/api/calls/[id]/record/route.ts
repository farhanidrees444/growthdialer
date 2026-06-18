import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';

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

  if (isTwilioVoiceConfigured()) {
    return NextResponse.json({
      ok: true,
      action,
      message:
        action === 'record_start'
          ? 'Recording is enabled automatically on connected calls when recording is turned on for your line.'
          : 'Recording stops when the call ends.',
    });
  }

  return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
}
