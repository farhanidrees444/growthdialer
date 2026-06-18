import { appendFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const LOG_PATH = path.join(process.cwd(), 'debug-30998c.log');

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (payload?.sessionId !== '30998c') {
      return Response.json({ ok: false }, { status: 403 });
    }

    await appendFile(LOG_PATH, `${JSON.stringify({
      ...payload,
      receivedAt: Date.now(),
      transport: 'same-origin-route',
    })}\n`, 'utf8');
    console.info('[AgentDebug:30998c]', JSON.stringify(payload));

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
