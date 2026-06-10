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
      console.error(`[INBOUND] Telnyx ${action} failed:`, res.status, (await res.text()).slice(0, 200));
    }
    return res.ok;
  } catch (err) {
    console.error(`[INBOUND] Telnyx ${action} exception:`, err);
    return false;
  }
}
