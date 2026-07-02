import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { updateConferenceParticipantRole } from '@/lib/coaching/telnyx-conference';
import { toTelephonyMode } from '@/lib/coaching/coaching-mode';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/coaching/sessions/[id]/mode
// Body: { mode: 'listen' | 'whisper' | 'barge' }
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mode } = await request.json() as { mode?: string };
  if (!mode || !['listen', 'whisper', 'barge'].includes(mode)) {
    return NextResponse.json({ error: 'Valid mode required: listen | whisper | barge' }, { status: 400 });
  }

  const { data: coachSession } = await supabase
    .from('coaching_sessions')
    .select('id, coach_id, workspace_id, mode, call_id, telnyx_conference_id, coach_call_control_id, agent_participant_sid')
    .eq('id', id)
    .is('ended_at', null)
    .single();

  if (!coachSession) return NextResponse.json({ error: 'Session not found or ended' }, { status: 404 });
  if (coachSession.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', coachSession.workspace_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!member || !hasPermission(member.role as Role, 'COACH_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (
    coachSession.telnyx_conference_id
    && coachSession.coach_call_control_id
  ) {
    try {
      await updateConferenceParticipantRole(
        coachSession.telnyx_conference_id,
        coachSession.coach_call_control_id,
        {
          mode: toTelephonyMode(mode),
          whisperToCallControlIds: coachSession.agent_participant_sid
            ? [coachSession.agent_participant_sid]
            : undefined,
        },
      );
    } catch (err) {
      console.error('[coaching/mode] supervisor role update failed:', err);
      return NextResponse.json({ error: 'Could not update coaching mode on the live call' }, { status: 502 });
    }
  }

  const { error } = await supabase
    .from('coaching_sessions')
    .update({ mode })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode });
}
