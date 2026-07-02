import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { startCoachOnCall } from '@/lib/coaching/telnyx-conference';
import { normalizeE164 } from '@/lib/inbound/phone';
import { readEnv } from '@/lib/voice/read-env';

export const dynamic = 'force-dynamic';

// POST /api/coaching/sessions/start
// Body: { call_id: string, mode: 'listen' | 'whisper' | 'barge' }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { call_id?: string; mode?: string };
  const { call_id, mode } = body;

  if (!call_id || !mode || !['listen', 'whisper', 'barge'].includes(mode)) {
    return NextResponse.json({ error: 'call_id and valid mode required' }, { status: 400 });
  }

  const { data: coachMember } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (!coachMember || !hasPermission(coachMember.role as Role, 'COACH_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id, from_number, workspace_id, status, ended_at')
    .eq('id', call_id)
    .eq('workspace_id', coachMember.workspace_id)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.ended_at || call.status === 'completed') {
    return NextResponse.json({ error: 'Call has ended' }, { status: 410 });
  }
  if (call.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot coach your own call' }, { status: 400 });
  }

  const fromNumber = normalizeE164(call.from_number ?? '') ?? readEnv('TELNYX_FROM_NUMBER');
  if (!fromNumber) {
    return NextResponse.json({ error: 'No caller ID available for coaching leg' }, { status: 422 });
  }

  await supabase
    .from('coaching_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('call_id', call_id)
    .eq('coach_id', user.id)
    .is('ended_at', null);

  const telephony = await startCoachOnCall(supabase, {
    call,
    coachId: user.id,
    workspaceId: coachMember.workspace_id,
    mode,
    fromNumber,
  });

  if (!telephony.ok) {
    return NextResponse.json({ error: telephony.error }, { status: telephony.status });
  }

  const { data: coachingSession, error } = await supabase
    .from('coaching_sessions')
    .insert({
      call_id,
      agent_id: call.user_id,
      coach_id: user.id,
      workspace_id: coachMember.workspace_id,
      mode,
      telnyx_conference_id: telephony.conferenceId,
      coach_call_control_id: telephony.coachCallControlId,
      agent_participant_sid: telephony.agentCallControlId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();
  await supabase
    .from('active_calls')
    .update({
      conference_sid: telephony.conferenceId,
      agent_participant_sid: telephony.agentCallControlId,
      metadata: {
        conference_name: telephony.conferenceId,
        coach_call_control_id: telephony.coachCallControlId,
      },
      updated_at: now,
      last_event_at: now,
    })
    .eq('call_id', call_id);

  return NextResponse.json({
    ok: true,
    session: coachingSession,
    telnyx_conference_id: telephony.conferenceId,
    coach_call_control_id: telephony.coachCallControlId,
    mode,
  }, { status: 201 });
}
