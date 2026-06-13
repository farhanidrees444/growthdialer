import { appendFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const INGEST_URL = 'http://127.0.0.1:7379/ingest/0b038bd8-a4b0-46ba-b218-7da01641d89a';
const LOG_FILE = join(process.cwd(), '.cursor', 'debug-30998c.log');

/** Server-side debug log for voice session 30998c — kept for active debug session. */
export function voiceServerLog(payload: Record<string, unknown>): void {
  const body = { sessionId: '30998c', timestamp: Date.now(), ...payload };

  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, `${JSON.stringify(body)}\n`, { encoding: 'utf8' });
  } catch { /* non-fatal — ephemeral FS on serverless */ }

  void fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '30998c',
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}
