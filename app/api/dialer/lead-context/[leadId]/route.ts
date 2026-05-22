import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AiBrief {
  bestTime: { text: string; confidence: number; basis: string };
  talkingPoints: string[];
  memories: { date: string; snippet: string }[];
  generatedAt: string;
}

async function generateAiBrief(lead: Record<string, unknown>): Promise<AiBrief | null> {
  try {
    const { geminiAI, GEMINI_MODEL } = await import('@/lib/ai/clients');

    const model = geminiAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    });

    const prompt = `You are a sales intelligence AI. Given this lead's data, produce a JSON object with:
- bestTime: { text: "Tue-Thu, 10-11 AM", confidence: 3, basis: "Based on similar leads" }
- talkingPoints: array of 3 short bullet strings
Respond ONLY with valid JSON.

Lead: ${JSON.stringify({
  name: lead.name,
  title: lead.title,
  company: lead.company,
  industry: lead.industry,
  status: lead.status,
  call_attempts: lead.call_attempts,
  activity_summary: lead.activity_summary,
})}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    return {
      bestTime: parsed.bestTime ?? { text: 'Tue–Thu, 10–11 AM', confidence: 3, basis: 'General patterns' },
      talkingPoints: (parsed.talkingPoints ?? []).slice(0, 3),
      memories: [],
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [{ data: lead, error: leadError }, { data: calls }] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('calls')
        .select('id, status, disposition, notes, created_at, answered_at, ended_at, duration_seconds')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Generate AI brief (best-effort)
    const brief = await generateAiBrief(lead as Record<string, unknown>);

    return NextResponse.json({
      lead,
      callHistory: calls ?? [],
      brief: brief ?? {
        bestTime: { text: 'Tue–Thu, 10–11 AM', confidence: 3, basis: 'Based on similar leads' },
        talkingPoints: [
          `Introduce GrowthDialer to ${lead.company ?? 'their team'}`,
          'Ask about current outreach challenges',
          'Highlight AI-powered calling features',
        ],
        memories: [],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[lead-context]', err);
    return NextResponse.json({ error: 'Failed to load lead context' }, { status: 500 });
  }
}
