import type { ConferenceHandle, TelephonyConferenceMode } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { supervisorRoleForMode } from '@/lib/coaching/coaching-mode';

export function coachingConferenceName(callId: string): string {
  return `gd-coaching-${callId}`;
}

export async function createConferenceForCall(
  callControlId: string,
  callId: string,
): Promise<ConferenceHandle> {
  const conferenceName = coachingConferenceName(callId);
  const result = await telephonyRequest<{
    data?: { id?: string; name?: string; call_control_id?: string };
  }>(
    `/calls/${encodeURIComponent(callControlId)}/actions/conference`,
    {
      method: 'POST',
      body: JSON.stringify({
        conference_name: conferenceName,
        start_conference_on_enter: true,
        end_conference_on_exit: false,
        beep_enabled: 'never',
      }),
    },
  );

  const conferenceId = result.data?.name ?? result.data?.id ?? conferenceName;
  return {
    conferenceId,
    callControlId: result.data?.call_control_id ?? callControlId,
  };
}

export async function joinCallToConference(
  conferenceId: string,
  participantCallControlId: string,
  options: {
    mode: TelephonyConferenceMode;
    whisperToCallControlIds?: string[];
  },
): Promise<void> {
  const supervisorRole = supervisorRoleForMode(options.mode);
  const body: Record<string, unknown> = {
    call_control_id: participantCallControlId,
    supervisor_role: supervisorRole,
    beep_enabled: 'never',
    start_conference_on_enter: false,
    mute: supervisorRole === 'monitor',
  };

  if (supervisorRole === 'whisper' && options.whisperToCallControlIds?.length) {
    body.whisper_call_control_ids = options.whisperToCallControlIds;
  }

  await telephonyRequest(
    `/conferences/${encodeURIComponent(conferenceId)}/actions/join`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function updateConferenceParticipantRole(
  conferenceId: string,
  participantCallControlId: string,
  options: {
    mode: TelephonyConferenceMode;
    whisperToCallControlIds?: string[];
  },
): Promise<void> {
  const supervisorRole = supervisorRoleForMode(options.mode);
  const body: Record<string, unknown> = {
    call_control_id: participantCallControlId,
    supervisor_role: supervisorRole,
  };

  if (supervisorRole === 'whisper' && options.whisperToCallControlIds?.length) {
    body.whisper_call_control_ids = options.whisperToCallControlIds;
  }

  await telephonyRequest(
    `/conferences/${encodeURIComponent(conferenceId)}/actions/update`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function removeParticipantFromConference(
  conferenceId: string,
  callControlId: string,
): Promise<void> {
  await telephonyRequest(
    `/conferences/${encodeURIComponent(conferenceId)}/actions/leave`,
    {
      method: 'POST',
      body: JSON.stringify({ call_control_id: callControlId }),
    },
  );
}

export async function hangupCallLeg(callControlId: string): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}
