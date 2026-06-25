import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { readTwilioNumber } from '@/lib/twilio/voice-config';
import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';

export type ConferenceUpgradeCall = {
  id: string;
  telnyx_call_id?: string | null;
  telnyx_session_id?: string | null;
  telnyx_webrtc_leg_id?: string | null;
};

export type ConferenceUpgradeResult =
  | { ok: true; conferenceName: string; redirectedLegs: string[]; agentLegSid: string }
  | { ok: false; error: string; status: number };

function conferenceName(callId: string): string {
  return `gd-coaching-${callId}`;
}

export function coachingConferenceTwimlUrl(callId: string, role: string): string {
  const base = resolveVoiceAppBaseUrl();
  if (!base) return '';
  return `${base}/api/twilio/coaching/conference?call_id=${encodeURIComponent(callId)}&role=${encodeURIComponent(role)}`;
}

export async function upgradeCallToConference(call: ConferenceUpgradeCall): Promise<ConferenceUpgradeResult> {
  const client = getTwilioRestClient();
  if (!client) return { ok: false, error: 'Voice service is not configured', status: 503 };

  const agentLegSid = call.telnyx_call_id?.trim() ?? '';
  const prospectLegSid = call.telnyx_session_id?.trim() ?? '';
  if (!isTwilioCallSid(agentLegSid) || !isTwilioCallSid(prospectLegSid)) {
    return {
      ok: false,
      error: 'This call cannot be upgraded because both live call legs are not available yet',
      status: 409,
    };
  }

  const agentUrl = coachingConferenceTwimlUrl(call.id, 'agent');
  const prospectUrl = coachingConferenceTwimlUrl(call.id, 'prospect');
  if (!agentUrl || !prospectUrl) {
    return { ok: false, error: 'Public app URL is not configured for voice redirects', status: 503 };
  }

  const redirectedLegs: string[] = [];
  await client.calls(agentLegSid).update({ url: agentUrl, method: 'POST' });
  redirectedLegs.push(agentLegSid);
  await client.calls(prospectLegSid).update({ url: prospectUrl, method: 'POST' });
  redirectedLegs.push(prospectLegSid);

  return {
    ok: true,
    conferenceName: conferenceName(call.id),
    redirectedLegs,
    agentLegSid,
  };
}

export async function dialManagerIntoConference(options: {
  conferenceName: string;
  managerIdentity: string;
  muted?: boolean;
}) {
  const client = getTwilioRestClient();
  if (!client) throw new Error('Voice service is not configured');
  const from = readTwilioNumber();
  if (!from) throw new Error('Voice caller ID is not configured');

  return client.conferences(options.conferenceName).participants.create({
    from,
    to: `client:${options.managerIdentity}`,
    muted: Boolean(options.muted),
    beep: 'false',
    earlyMedia: true,
    endConferenceOnExit: false,
  });
}

export async function findInProgressConference(conferenceName: string) {
  const client = getTwilioRestClient();
  if (!client) throw new Error('Voice service is not configured');
  const [conference] = await client.conferences.list({
    friendlyName: conferenceName,
    status: 'in-progress',
    limit: 1,
  });
  return conference ?? null;
}
