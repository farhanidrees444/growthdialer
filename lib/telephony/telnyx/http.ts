import { readTelephonyApiKey } from '@/lib/telephony/telnyx/env';

const API_BASE = 'https://api.telnyx.com/v2';

export class TelephonyHttpError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Voice API request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

export async function telephonyRequest<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiKey = readTelephonyApiKey();
  if (!apiKey) {
    throw new Error('Voice service is not configured');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(20_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Voice API request timed out');
    }
    throw err;
  }

  const text = await res.text();
  if (!res.ok) {
    throw new TelephonyHttpError(res.status, text);
  }

  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
