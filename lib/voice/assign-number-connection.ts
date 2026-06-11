import { getActiveVoiceConnectionId } from '@/lib/voice/configure-connection';
import { readVoiceApiKey } from '@/lib/voice/read-env';

const VOICE_API = 'https://api.telnyx.com/v2';

export async function assignNumberToVoiceConnection(telnyxNumberId: string): Promise<boolean> {
  const apiKey = readVoiceApiKey();
  const connectionId = await getActiveVoiceConnectionId();
  if (!apiKey || !connectionId || !telnyxNumberId) return false;

  try {
    const res = await fetch(`${VOICE_API}/phone_numbers/${telnyxNumberId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection_id: connectionId }),
    });
    if (!res.ok) {
      console.error('[VOICE] assign connection failed:', telnyxNumberId, res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[VOICE] assign connection exception:', err);
    return false;
  }
}

export async function getNumberConnectionId(telnyxNumberId: string): Promise<string | null> {
  const apiKey = readVoiceApiKey();
  if (!apiKey || !telnyxNumberId) return null;

  try {
    const res = await fetch(`${VOICE_API}/phone_numbers/${telnyxNumberId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data?: { connection_id?: string | null } };
    return json.data?.connection_id ?? null;
  } catch {
    return null;
  }
}
