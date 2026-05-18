import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const supabase = createServiceClient();
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {};

  // Check Telnyx API reachability
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=US&filter[limit]=1', {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.telnyx = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.telnyx = { ok: false, detail: 'timeout' };
  }

  // Check Groq reachability
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.groq = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.groq = { ok: false, detail: 'timeout' };
  }

  // Check Gemini reachability
  try {
    const t0 = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY ?? ''}`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.gemini = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.gemini = { ok: false, detail: 'timeout' };
  }

  // Check most recent AI processing in DB
  if (supabase) {
    try {
      const { data } = await supabase
        .from('call_analytics')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      checks.aiPipeline = {
        ok: true,
        detail: data?.created_at ?? 'no records yet',
      };
    } catch {
      checks.aiPipeline = { ok: false };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
