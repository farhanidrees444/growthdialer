export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (payload?.sessionId !== '30998c') {
      return Response.json({ ok: false }, { status: 403 });
    }

    console.info('[AgentDebug:30998c]', JSON.stringify({
      ...payload,
      receivedAt: Date.now(),
      transport: 'same-origin-route',
    }));

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
