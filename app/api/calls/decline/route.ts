import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { declineTwilioInboundCall } from '@/lib/twilio/decline-inbound-call';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';

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

    const body = await request.json() as {
      call_control_id?: string;
      call_sid?: string;
    };

    const callSid = (body.call_sid ?? body.call_control_id)?.trim();
    if (!callSid) {
      return NextResponse.json({ error: 'call_sid is required' }, { status: 400 });
    }

    if (!isTwilioVoiceConfigured()) {
      return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
    }

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    if (isTwilioCallSid(callSid)) {
      const result = await declineTwilioInboundCall(service, {
        callSid,
        userId: user.id,
        reason: 'agent_declined',
      });
      if (!result.ok && result.status !== 'invalid_sid') {
        return NextResponse.json({ error: 'Call is no longer declineable' }, { status: 409 });
      }
      return NextResponse.json({
        ok: true,
        status: result.status,
        declined: true,
        call_id: result.callId ?? null,
      });
    }

    return NextResponse.json({ error: 'Invalid call reference' }, { status: 400 });
  } catch (err) {
    console.error('[CALLS/DECLINE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
