/**
 * Bridge a server-dialed prospect leg to the agent's WebRTC SIP endpoint.
 */

export function getAgentBridgeDestination(): string | null {
  const explicit = process.env.TELNYX_AGENT_SIP_URI?.trim();
  if (explicit) return explicit;

  const username = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME?.trim()
    ?? process.env.TELNYX_SIP_USERNAME?.trim();
  if (!username) return null;

  return `sip:${username}@sip.telnyx.com`;
}

export async function telnyxCallAction(
  callControlId: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/${action}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error(`[PARALLEL] Telnyx ${action} failed:`, res.status, (await res.text()).slice(0, 200));
    }
    return res.ok;
  } catch (err) {
    console.error(`[PARALLEL] Telnyx ${action} exception:`, err);
    return false;
  }
}

export async function bridgeProspectToAgent(
  prospectCallControlId: string,
  fromNumber: string,
): Promise<boolean> {
  const destination = getAgentBridgeDestination();
  if (!destination) {
    console.error('[PARALLEL] No agent SIP destination configured');
    return false;
  }

  await telnyxCallAction(prospectCallControlId, 'answer');
  await new Promise((r) => setTimeout(r, 300));

  return telnyxCallAction(prospectCallControlId, 'transfer', {
    to: destination,
    from: fromNumber,
  });
}

export async function hangupCallControl(callControlId: string): Promise<void> {
  await telnyxCallAction(callControlId, 'hangup');
}
