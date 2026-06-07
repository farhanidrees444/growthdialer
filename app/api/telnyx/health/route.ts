import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const serviceSupabase = createServiceClient();
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {};

  // Check Telnyx API reachability
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=US&filter[limit]=1', {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.voice_network = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.voice_network = { ok: false, detail: 'timeout' };
  }

  // Check transcription service reachability
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.transcription = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.transcription = { ok: false, detail: 'timeout' };
  }

  // Check call analysis service reachability
  try {
    const t0 = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY ?? ''}`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.call_analysis = { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch {
    checks.call_analysis = { ok: false, detail: 'timeout' };
  }

  // Check most recent AI processing in DB
  if (serviceSupabase) {
    try {
      const { data } = await serviceSupabase
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
