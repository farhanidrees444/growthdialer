import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized', recordings: [] }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sentiment = searchParams.get('sentiment') ?? '';
    const search = searchParams.get('search') ?? '';

    // Select only verified calls columns (42703 fix: removed ai_processing_status, analytics_id)
    const { data: calls, error } = await supabase
      .from('calls')
      .select(`
        id, recording_url, duration_seconds, transcript,
        started_at, disposition, was_recorded,
        from_number, to_number, direction,
        ai_summary, ai_sentiment, ai_intent,
        ai_next_steps, ai_keywords, ai_analysis_status,
        lead_id,
        leads:lead_id (first_name, last_name, company)
      `)
      .eq('user_id', user.id)
      .eq('was_recorded', true)
      .not('recording_url', 'is', null)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[RECORDINGS-LIST] DB error:', error);
      return NextResponse.json({ error: error.message, recordings: [] }, { status: 500 });
    }

    // Map directly from calls columns — no batch analytics fetch needed
    let enriched = (calls ?? []).map((r) => ({
      ...r,
      ai_sentiment: (r.ai_sentiment as string | null) ?? null,
      ai_summary_raw: r.ai_summary ?? null,
      ai_next_steps_raw: r.ai_next_steps ?? null,
      ai_keywords: Array.isArray(r.ai_keywords) ? r.ai_keywords as string[] : null,
    }));

    if (sentiment) {
      enriched = enriched.filter((r) => r.ai_sentiment === sentiment);
    }

    if (search) {
      const s = search.toLowerCase();
      enriched = enriched.filter((r) => {
        const lead = r.leads as { first_name?: string; last_name?: string; company?: string } | null;
        const name = `${lead?.first_name ?? ''} ${lead?.last_name ?? ''}`.toLowerCase();
        const company = (lead?.company ?? '').toLowerCase();
        const tx = (r.transcript ?? '').toLowerCase();
        return name.includes(s) || company.includes(s) || tx.includes(s);
      });
    }

    console.log('[RECORDINGS-LIST]', user.email, 'count:', enriched.length);
    return NextResponse.json({ recordings: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RECORDINGS-LIST] Crash:', msg);
    return NextResponse.json({ error: msg, recordings: [] }, { status: 500 });
  }
}
