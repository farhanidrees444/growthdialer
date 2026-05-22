import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';

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

  // Verify coach has permission
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

  // Get the call being coached
  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, telnyx_call_id, workspace_id, status')
    .eq('id', call_id)
    .eq('workspace_id', coachMember.workspace_id)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.status === 'ended') return NextResponse.json({ error: 'Call has ended' }, { status: 410 });
  if (call.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot coach your own call' }, { status: 400 });
  }

  // End any existing coaching session for this call by this coach
  await supabase
    .from('coaching_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('call_id', call_id)
    .eq('coach_id', user.id)
    .is('ended_at', null);

  // Create new coaching session record
  const { data: coachingSession, error } = await supabase
    .from('coaching_sessions')
    .insert({
      call_id,
      agent_id: call.user_id,
      coach_id: user.id,
      workspace_id: coachMember.workspace_id,
      mode,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For barge/whisper: the coach would join via Telnyx conference API
  // This requires the agent's call to be moved into a conference room.
  // The telnyx_call_id is the call control ID for the agent's leg.
  // In production: create conference, issue transfer/join commands via Telnyx API.
  // The coach's browser WebRTC SDK then dials into the conference number.
  const telnyxCallId = call.telnyx_call_id;

  return NextResponse.json({
    ok: true,
    session: coachingSession,
    telnyx_call_id: telnyxCallId,
    mode,
  }, { status: 201 });
}
