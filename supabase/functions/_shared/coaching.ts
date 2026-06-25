// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type Supabase = ReturnType<typeof createServiceClient>;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase service credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireInternalAuth(req: Request): Promise<Response | null> {
  const expected = Deno.env.get('INTERNAL_API_SECRET')?.trim();
  if (!expected) return json({ error: 'Server misconfigured' }, 503);
  if (req.headers.get('x-internal-secret') !== expected) return json({ error: 'Unauthorized' }, 401);
  return null;
}

export async function geminiJson<T>(prompt: string): Promise<T> {
  const key = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, responseMimeType: 'application/json' },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) as T;
}

export async function transcribeWithGroq(audioUrl: string): Promise<string> {
  const key = Deno.env.get('GROQ_API_KEY')?.trim();
  if (!key) throw new Error('GROQ_API_KEY is not configured');

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Recording download failed: ${audioRes.status}`);
  const audio = await audioRes.arrayBuffer();
  if (audio.byteLength === 0) throw new Error('Recording download returned 0 bytes');

  const form = new FormData();
  form.set('file', new File([audio], 'recording.mp3', { type: 'audio/mpeg' }));
  form.set('model', 'whisper-large-v3');
  form.set('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Groq transcription failed: ${res.status}`);
  const payload = await res.json();
  return String(payload.text ?? '').trim();
}

export function weekWindow(date = new Date()): { start: string; end: string } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + 6);
  return { start: d.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
