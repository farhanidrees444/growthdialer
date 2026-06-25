import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { dialManagerIntoConference, upgradeCallToConference } from '@/lib/coaching/twilio-conference';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { call_id?: string; workspace_id?: string; muted?: boolean };
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, {
    permission: 'BARGE_CALLS',
    body,
  });
  if (isWorkspaceError(access)) return access;

  const callId = body.call_id?.trim();
  if (!callId) return NextResponse.json({ error: 'call_id required' }, { status: 400 });

  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, workspace_id, status, ended_at, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id')
    .eq('id', callId)
    .eq('workspace_id', access.workspaceId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.ended_at || ['completed', 'failed', 'missed'].includes(call.status ?? '')) {
    return NextResponse.json({ error: 'Call is not active' }, { status: 409 });
  }
  if (call.user_id === user.id) return NextResponse.json({ error: 'Cannot barge your own call' }, { status: 400 });

  const upgrade = await upgradeCallToConference(call);
  if (!upgrade.ok) return NextResponse.json({ error: upgrade.error }, { status: upgrade.status });

  const participant = await dialManagerIntoConference({
    conferenceName: upgrade.conferenceName,
    managerIdentity: toTwilioClientIdentity(user.id),
    muted: body.muted ?? false,
  });

  const now = new Date().toISOString();
  await supabase
    .from('active_calls')
    .update({
      conference_sid: upgrade.conferenceName,
      agent_participant_sid: upgrade.agentLegSid,
      metadata: {
        conference_name: upgrade.conferenceName,
        manager_call_sid: participant.callSid,
        redirected_legs: upgrade.redirectedLegs,
      },
      updated_at: now,
      last_event_at: now,
    })
    .eq('call_id', call.id);

  await supabase.from('coaching_sessions').insert({
    call_id: call.id,
    agent_id: call.user_id,
    coach_id: user.id,
    workspace_id: access.workspaceId,
    mode: body.muted ? 'listen' : 'barge',
    twilio_conference_sid: upgrade.conferenceName,
    coach_participant_sid: participant.callSid,
    agent_participant_sid: upgrade.agentLegSid,
    started_at: now,
  });

  return NextResponse.json({
    ok: true,
    conference_name: upgrade.conferenceName,
    manager_call_sid: participant.callSid,
    muted: body.muted ?? false,
  });
}
