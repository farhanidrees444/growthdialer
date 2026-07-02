import type { SupabaseClient } from '@supabase/supabase-js';
import type { TelephonyConferenceMode } from '@/lib/telephony/types';
import { getTelephonyProvider } from '@/lib/telephony';
import {
  createConferenceForCall,
  joinCallToConference,
  removeParticipantFromConference,
  updateConferenceParticipantRole,
} from '@/lib/telephony/telnyx/conference';
import { dialCoachLeg } from '@/lib/telephony/telnyx/conference-coach';
import { toTelephonyMode } from '@/lib/coaching/coaching-mode';

export type CoachingCallRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  telnyx_call_id?: string | null;
  telnyx_session_id?: string | null;
  telnyx_webrtc_leg_id?: string | null;
  from_number?: string | null;
  status?: string | null;
  ended_at?: string | null;
};

export type CoachingSessionStartResult =
  | {
      ok: true;
      conferenceId: string;
      agentCallControlId: string;
      coachCallControlId: string;
    }
  | { ok: false; error: string; status: number };

export function resolveAgentCallControlId(call: CoachingCallRow): string | null {
  return (
    call.telnyx_call_id?.trim()
    ?? call.telnyx_webrtc_leg_id?.trim()
    ?? call.telnyx_session_id?.trim()
    ?? null
  );
}

export async function ensureCoachingConference(
  call: CoachingCallRow,
): Promise<
  | { ok: true; conferenceId: string; agentCallControlId: string }
  | { ok: false; error: string; status: number }
> {
  const provider = getTelephonyProvider();
  if (!provider.isConfigured()) {
    return { ok: false, error: 'Voice service is not configured', status: 503 };
  }

  const agentCallControlId = resolveAgentCallControlId(call);
  if (!agentCallControlId) {
    return {
      ok: false,
      error: 'Active call leg is not available yet — wait until the call connects',
      status: 409,
    };
  }

  try {
    const handle = await createConferenceForCall(agentCallControlId, call.id);
    return {
      ok: true,
      conferenceId: handle.conferenceId,
      agentCallControlId: handle.callControlId,
    };
  } catch (err) {
    console.error('[coaching] conference create failed:', err);
    return { ok: false, error: 'Could not start coaching conference', status: 502 };
  }
}

export async function startCoachOnCall(
  supabase: SupabaseClient,
  params: {
    call: CoachingCallRow;
    coachId: string;
    workspaceId: string;
    mode: string;
    fromNumber: string;
  },
): Promise<CoachingSessionStartResult> {
  const telephonyMode = toTelephonyMode(params.mode);
  const conference = await ensureCoachingConference(params.call);
  if (!conference.ok) return conference;

  const dial = await dialCoachLeg({
    coachId: params.coachId,
    workspaceId: params.workspaceId,
    conferenceId: conference.conferenceId,
    mode: telephonyMode,
    agentCallControlId: conference.agentCallControlId,
    callId: params.call.id,
    fromNumber: params.fromNumber,
  });

  if (!dial.ok) {
    return { ok: false, error: dial.error, status: dial.status };
  }

  return {
    ok: true,
    conferenceId: conference.conferenceId,
    agentCallControlId: conference.agentCallControlId,
    coachCallControlId: dial.coachCallControlId,
  };
}

export async function handleCoachLegAnswered(
  supabase: SupabaseClient,
  coachCallControlId: string,
  state: Record<string, unknown>,
): Promise<void> {
  const conferenceId = String(state.conference_id ?? '');
  const mode = toTelephonyMode(String(state.mode ?? 'listen'));
  const agentCallControlId = String(state.agent_call_control_id ?? '');
  const callId = String(state.call_id ?? '');
  const coachId = String(state.coach_id ?? '');

  if (!conferenceId || !coachCallControlId) return;

  await joinCallToConference(conferenceId, coachCallControlId, {
    mode,
    whisperToCallControlIds: agentCallControlId ? [agentCallControlId] : undefined,
  });

  if (callId && coachId) {
    await supabase
      .from('coaching_sessions')
      .update({
        coach_call_control_id: coachCallControlId,
        telnyx_conference_id: conferenceId,
        agent_participant_sid: agentCallControlId || null,
      })
      .eq('call_id', callId)
      .eq('coach_id', coachId)
      .is('ended_at', null);
  }
}

export {
  coachingConferenceName,
  removeParticipantFromConference,
  updateConferenceParticipantRole,
} from '@/lib/telephony/telnyx/conference';
