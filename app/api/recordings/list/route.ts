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

    const { data: calls, error } = await supabase
      .from('calls')
      .select(`
        id, recording_url, recording_supabase_path, recording_duration_seconds,
        duration_seconds, transcript, transcript_status, ai_summary, ai_sentiment,
        ai_intent, ai_keywords, ai_next_steps, ai_objections, ai_analysis_status,
        from_number, to_number, started_at, disposition, direction, lead_id,
        leads:lead_id (first_name, last_name, company)
      `)
      .eq('user_id', user.id)
      .not('recording_url', 'is', null)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[RECORDINGS-LIST] DB error:', error);
      return NextResponse.json({ error: error.message, recordings: [] }, { status: 500 });
    }

    let enriched = (calls ?? []).map((r) => ({
      id: r.id,
      recording_url: r.recording_url,
      recording_supabase_path: r.recording_supabase_path ?? null,
      recording_duration_seconds: (r.recording_duration_seconds as number | null) ?? null,
      duration_seconds: r.duration_seconds,
      transcript: r.transcript,
      transcript_status: (r.transcript_status as string | null) ?? null,
      started_at: r.started_at,
      disposition: r.disposition,
      // analytics_id doesn't exist on calls — always null so frontend falls back gracefully
      analytics_id: null as string | null,
      // ai_analysis_status maps to ai_processing_status expected by frontend
      ai_processing_status: (r.ai_analysis_status as string | null) ?? null,
      from_number: r.from_number,
      to_number: r.to_number,
      direction: r.direction,
      lead_id: r.lead_id,
      leads: r.leads as unknown as { first_name: string | null; last_name: string | null; company: string | null } | null,
      ai_sentiment: (r.ai_sentiment as string | null) ?? null,
      ai_sentiment_score: null as number | null,
      ai_summary_raw: r.ai_summary ?? null,
      ai_next_steps_raw: r.ai_next_steps ?? null,
      ai_keywords: Array.isArray(r.ai_keywords) ? (r.ai_keywords as string[]) : null,
      ai_objections: Array.isArray(r.ai_objections) ? (r.ai_objections as string[]) : null,
    }));

    if (sentiment) {
      enriched = enriched.filter((r) => r.ai_sentiment === sentiment);
    }

    if (search) {
      const s = search.toLowerCase();
      enriched = enriched.filter((r) => {
        const lead = r.leads;
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
