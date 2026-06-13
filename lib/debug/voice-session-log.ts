/** Debug-mode voice pipeline logging (dev only). */
export function voiceSessionLog(payload: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
}): void {
  const body = {
    sessionId: '30998c',
    timestamp: Date.now(),
    ...payload,
  };

  if (typeof window !== 'undefined') {
    try {
      const key = 'gd-voice-debug-30998c';
      const prev = JSON.parse(sessionStorage.getItem(key) ?? '[]') as unknown[];
      prev.push(body);
      sessionStorage.setItem(key, JSON.stringify(prev.slice(-80)));
    } catch { /* non-fatal */ }

    fetch('/api/debug/voice-session-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});

    fetch('http://127.0.0.1:7379/ingest/0b038bd8-a4b0-46ba-b218-7da01641d89a', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '30998c',
      },
      body: JSON.stringify(body),
    }).catch(() => {});
  }
}
