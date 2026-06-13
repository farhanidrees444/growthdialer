/** Minimal Telnyx answer — no heavy imports (critical webhook path). */

export interface FastAnswerResult {
  ok: boolean;
  status: number | null;
  telnyxStatus: string | null;
  errorMessage: string | null;
  responseTimeMs: number;
  answerSentAt: string;
  skipped: boolean;
  skipReason: string | null;
}

function readApiKey(): string | null {
  const raw = process.env.TELNYX_API_KEY;
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  return trimmed || null;
}

/** True when client_state marks a browser bridge leg (must not answer). */
export function isBridgeLegClientState(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Record<string, unknown>;
    return Boolean(json.gd_inbound_bridge || json.gd_parallel_bridge);
  } catch {
    return false;
  }
}

export async function sendTelnyxAnswerFast(callControlId: string): Promise<FastAnswerResult> {
  const answerSentAt = new Date().toISOString();
  const start = Date.now();
  const apiKey = readApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: null,
      telnyxStatus: 'config_error',
      errorMessage: 'TELNYX_API_KEY missing',
      responseTimeMs: Date.now() - start,
      answerSentAt,
      skipped: false,
      skipReason: null,
    };
  }

  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/answer`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    const text = await res.text();
    const responseTimeMs = Date.now() - start;

    return {
      ok: res.ok,
      status: res.status,
      telnyxStatus: res.ok ? 'ok' : String(res.status),
      errorMessage: res.ok ? null : text.slice(0, 4000),
      responseTimeMs,
      answerSentAt,
      skipped: false,
      skipReason: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: null,
      telnyxStatus: 'exception',
      errorMessage: message.slice(0, 4000),
      responseTimeMs: Date.now() - start,
      answerSentAt,
      skipped: false,
      skipReason: null,
    };
  }
}

export function skippedAnswerResult(reason: string): FastAnswerResult {
  const now = new Date().toISOString();
  return {
    ok: true,
    status: null,
    telnyxStatus: 'skipped',
    errorMessage: null,
    responseTimeMs: 0,
    answerSentAt: now,
    skipped: true,
    skipReason: reason,
  };
}
