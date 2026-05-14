import { Telnyx } from 'telnyx';

if (!process.env.TELNYX_API_KEY) {
  console.warn('TELNYX_API_KEY is not set');
}

const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY ?? '');

export default telnyxClient;

export async function hangupCall(callControlId: string): Promise<void> {
  const res = await fetch(
    `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telnyx hangup failed (${res.status}): ${body}`);
  }
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

export function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (/^\+[1-9]\d{1,14}$/.test(digits)) return digits;
  const bare = digits.replace(/^\+/, '');
  if (bare.length === 10) return `+1${bare}`;
  if (bare.length === 11 && bare.startsWith('1')) return `+${bare}`;
  return null;
}
