import { NextRequest, NextResponse } from 'next/server';
import { analyzeCallWithGemini, analyzeCallWithGroq } from '@/lib/ai/clients';

export const maxDuration = 60;

const SAMPLE_TRANSCRIPT = `
Sales Rep: Hi, is this John from Acme Corp?
Prospect: Yes, this is John.
Sales Rep: Great, I'm calling from GrowthDialer. We help SaaS companies automate their outbound sales process. Do you have a few minutes?
Prospect: I actually only have about 5 minutes, what's this about?
Sales Rep: Perfect, I'll be quick. We've helped companies like yours reduce their outbound call time by 40% using AI-powered dialing and call analytics. Does that sound relevant to your team?
Prospect: We actually tried something similar last year, it was too expensive for us.
Sales Rep: I totally understand the cost concern — it's the most common thing I hear. Can I ask what your current process looks like for outbound prospecting?
Prospect: We have 3 SDRs manually dialing about 80 calls per day each. It's a lot.
Sales Rep: That's actually the exact use case where our platform shines. At 240 daily calls, you could realistically get to 400+ with the same team. I'd love to show you a quick demo — are you free Thursday or Friday afternoon?
Prospect: Maybe Friday works. Send me something first and I'll take a look.
Sales Rep: Absolutely, I'll send that over right now. Is your email john@acmecorp.com?
Prospect: Yes that's right.
Sales Rep: Perfect. I'll send the overview and a calendar link for Friday. Thanks for your time, John!
`;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let transcript = SAMPLE_TRANSCRIPT;
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (typeof body.transcript === 'string' && body.transcript.trim()) {
      transcript = body.transcript;
    }
  } catch {
    // use sample
  }

  const results: Record<string, unknown> = {
    transcript_length: transcript.length,
    transcript_preview: transcript.slice(0, 200),
    tests: {},
  };

  // Test Gemini
  const geminiStart = Date.now();
  try {
    const analysis = await analyzeCallWithGemini(
      transcript,
      'Acme Corp',
      'SaaS',
      'VP of Sales',
      '',
    );
    results.tests = {
      ...results.tests as Record<string, unknown>,
      gemini: {
        ok: true,
        latency_ms: Date.now() - geminiStart,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        suggested_disposition: analysis.suggested_disposition,
        summary_count: analysis.summary?.length ?? 0,
        memories_count: analysis.memories_to_save?.length ?? 0,
        next_steps: analysis.next_steps,
      },
    };
  } catch (err) {
    results.tests = {
      ...results.tests as Record<string, unknown>,
      gemini: { ok: false, latency_ms: Date.now() - geminiStart, error: String(err) },
    };
  }

  // Test Groq Llama fallback
  const groqStart = Date.now();
  try {
    const analysis = await analyzeCallWithGroq(
      transcript,
      'Acme Corp',
      'SaaS',
      'VP of Sales',
      '',
    );
    results.tests = {
      ...results.tests as Record<string, unknown>,
      groq: {
        ok: true,
        latency_ms: Date.now() - groqStart,
        sentiment: analysis.sentiment,
        suggested_disposition: analysis.suggested_disposition,
        summary_count: analysis.summary?.length ?? 0,
      },
    };
  } catch (err) {
    results.tests = {
      ...results.tests as Record<string, unknown>,
      groq: { ok: false, latency_ms: Date.now() - groqStart, error: String(err) },
    };
  }

  const tests = results.tests as Record<string, { ok: boolean }>;
  const allOk = Object.values(tests).every((t) => t.ok);

  return NextResponse.json({
    status: allOk ? 'all_passed' : 'some_failed',
    timestamp: new Date().toISOString(),
    ...results,
  });
}
