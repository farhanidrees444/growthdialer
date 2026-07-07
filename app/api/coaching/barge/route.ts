import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { coachingConferenceName, startCoachOnCall } from '@/lib/coaching/telnyx-conference';
import { normalizeE164 } from '@/lib/inbound/phone';
import { readEnv } from '@/lib/voice/read-env';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { call_id?: string; workspace_id?: string; muted?: boolean };
  const userId = user.id;
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, {
    permission: 'BARGE_CALLS',
    body,
  });
  if (isWorkspaceError(access)) return access;

  const callId = body.call_id?.trim();
  if (!callId) return NextResponse.json({ error: 'call_id required' }, { status: 400 });

  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, workspace_id, status, ended_at, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id, from_number')
    .eq('id', callId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.ended_at || ['completed', 'failed', 'missed'].includes(call.status ?? '')) {
    return NextResponse.json({ error: 'Call is not active' }, { status: 409 });
  }
  if (call.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot barge your own call' }, { status: 400 });
  }

  const fromNumber = normalizeE164(call.from_number ?? '') ?? readEnv('TELNYX_FROM_NUMBER');
  if (!fromNumber) {
    return NextResponse.json({ error: 'No caller ID available for coaching leg' }, { status: 422 });
  }

  const mode = body.muted === false ? 'barge' : 'listen';
  const started = await startCoachOnCall(supabase, {
    call,
    coachId: user.id,
    workspaceId: userId,
    mode,
    fromNumber,
  });

  if (!started.ok) {
    return NextResponse.json({ error: started.error }, { status: started.status });
  }

  const conferenceName = coachingConferenceName(call.id);
  const now = new Date().toISOString();

  await supabase
    .from('active_calls')
    .update({
      conference_sid: conferenceName,
      agent_participant_sid: started.agentCallControlId,
      metadata: {
        conference_name: conferenceName,
        coach_call_control_id: started.coachCallControlId,
        telnyx_conference_id: started.conferenceId,
      },
      updated_at: now,
      last_event_at: now,
    })
    .eq('call_id', call.id);

  await supabase.from('coaching_sessions').insert({
    call_id: call.id,
    agent_id: call.user_id,
    coach_id: user.id,
    mode,
    telnyx_conference_id: started.conferenceId,
    coach_call_control_id: started.coachCallControlId,
    agent_participant_sid: started.agentCallControlId,
  });

  return NextResponse.json({
    ok: true,
    conference_name: conferenceName,
    coach_call_control_id: started.coachCallControlId,
    muted: mode === 'listen',
  });
}
