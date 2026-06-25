import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { findInProgressConference } from '@/lib/coaching/twilio-conference';
import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';

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

  const { data: active } = await supabase
    .from('active_calls')
    .select('call_id, workspace_id, agent_id, conference_sid, agent_participant_sid, metadata')
    .eq('call_id', callId)
    .eq('workspace_id', access.workspaceId)
    .maybeSingle();
  if (!active) return NextResponse.json({ error: 'Active conference data not found. Barge first, then take over.' }, { status: 409 });
  if (active.agent_id === user.id) return NextResponse.json({ error: 'Cannot take over your own call' }, { status: 400 });

  const metadata = (active.metadata ?? {}) as { conference_name?: string };
  const conferenceName = metadata.conference_name ?? active.conference_sid;
  const agentLegSid = active.agent_participant_sid;
  if (!conferenceName || !isTwilioCallSid(agentLegSid)) {
    return NextResponse.json({ error: 'Conference participant data is incomplete' }, { status: 409 });
  }

  const client = getTwilioRestClient();
  if (!client) return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });

  const conference = await findInProgressConference(conferenceName);
  if (!conference) {
    return NextResponse.json({ error: 'Conference is not active yet. Try again after the barge connection is established.' }, { status: 409 });
  }

  await client.conferences(conference.sid).participants(agentLegSid).remove();

  await supabase
    .from('coaching_sessions')
    .update({ mode: 'takeover', ended_at: null })
    .eq('call_id', callId)
    .eq('coach_id', user.id)
    .is('ended_at', null);

  return NextResponse.json({ ok: true, dropped_agent_call_sid: agentLegSid });
}
