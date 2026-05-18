import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  ok: boolean;
  latency: number;
  error?: string;
}

async function checkVoiceNetwork(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.telnyx.com/v2/whoami', {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: String(err) };
  }
}

async function checkAIEngine(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY ?? ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    return { ok: res.ok, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: String(err) };
  }
}

async function checkTranscriptionEngine(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: String(err) };
  }
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    });
    return { ok: res.ok, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: String(err) };
  }
}

export async function GET() {
  const [voice, ai, transcription, database] = await Promise.all([
    checkVoiceNetwork(),
    checkAIEngine(),
    checkTranscriptionEngine(),
    checkDatabase(),
  ]);

  const overall = voice.ok && ai.ok && transcription.ok && database.ok ? 'healthy' : 'degraded';

  return NextResponse.json({
    services: {
      voice_network: { ok: voice.ok, latency: `${voice.latency}ms` },
      transcription_engine: { ok: transcription.ok, latency: `${transcription.latency}ms` },
      ai_engine: { ok: ai.ok, latency: `${ai.latency}ms` },
      database: { ok: database.ok, latency: `${database.latency}ms` },
    },
    overall,
    timestamp: new Date().toISOString(),
  });
}
