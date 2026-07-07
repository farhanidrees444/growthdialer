import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import {
  removeParticipantFromConference,
  updateConferenceParticipantRole,
} from '@/lib/coaching/telnyx-conference';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { call_id?: string; workspace_id?: string };
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, {
    permission: 'BARGE_CALLS',
    body,
  });
  if (isWorkspaceError(access)) return access;

  const callId = body.call_id?.trim();
  if (!callId) return NextResponse.json({ error: 'call_id required' }, { status: 400 });

  const { data: session } = await supabase
    .from('coaching_sessions')
    .select('id, coach_id, telnyx_conference_id, coach_call_control_id, agent_participant_sid')
    .eq('call_id', callId)
    .eq('coach_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (!session?.telnyx_conference_id || !session.coach_call_control_id) {
    return NextResponse.json(
      { error: 'Active coaching session not found. Start coaching first, then take over.' },
      { status: 409 },
    );
  }

  const { data: call } = await supabase
    .from('calls')
    .select('user_id')
    .eq('id', callId)
    .maybeSingle();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot take over your own call' }, { status: 400 });
  }

  const agentLeg = session.agent_participant_sid?.trim();
  if (agentLeg) {
    try {
      await removeParticipantFromConference(session.telnyx_conference_id, agentLeg);
    } catch (err) {
      console.error('[coaching/takeover] remove agent failed:', err);
    }
  }

  try {
    await updateConferenceParticipantRole(
      session.telnyx_conference_id,
      session.coach_call_control_id,
      {
        mode: 'takeover',
        whisperToCallControlIds: undefined,
      },
    );
  } catch (err) {
    console.error('[coaching/takeover] promote coach failed:', err);
    return NextResponse.json({ error: 'Takeover could not be completed' }, { status: 502 });
  }

  await supabase
    .from('coaching_sessions')
    .update({ mode: 'takeover' })
    .eq('id', session.id);

  return NextResponse.json({
    ok: true,
    dropped_agent_call_control_id: agentLeg ?? null,
  });
}
