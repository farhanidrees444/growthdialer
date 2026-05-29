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

    // Fetch recorded calls — only columns that actually exist on the calls table.
    // AI results (summary, sentiment, etc.) live in call_analytics and are batch-joined below.
    const { data: calls, error } = await supabase
      .from('calls')
      .select(`
        id, recording_url, duration_seconds, transcript,
        started_at, disposition, was_recorded,
        from_number, to_number, direction,
        ai_processing_status, analytics_id, ai_processed,
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

    // Batch-fetch analytics for calls that have an analytics_id
    const analyticsIds = (calls ?? [])
      .map((c) => c.analytics_id as string | null)
      .filter((id): id is string => !!id);

    const analyticsMap = new Map<string, {
      sentiment: string | null;
      sentiment_score: number | null;
      summary: unknown;
      next_steps: string | null;
      talking_points: unknown;
      objections: unknown;
    }>();

    if (analyticsIds.length > 0) {
      const { data: analyticsRows, error: aErr } = await supabase
        .from('call_analytics')
        .select('id, sentiment, sentiment_score, summary, next_steps, talking_points, objections')
        .in('id', analyticsIds);

      if (aErr) {
        console.warn('[RECORDINGS-LIST] Analytics batch fetch failed:', aErr.message);
      } else {
        for (const row of analyticsRows ?? []) {
          analyticsMap.set(row.id as string, {
            sentiment: (row.sentiment as string | null) ?? null,
            sentiment_score: (row.sentiment_score as number | null) ?? null,
            summary: row.summary ?? null,
            next_steps: (row.next_steps as string | null) ?? null,
            talking_points: row.talking_points ?? null,
            objections: row.objections ?? null,
          });
        }
      }
    }

    // Merge calls + analytics, normalising to what the frontend Recording type expects
    let enriched = (calls ?? []).map((r) => {
      const analytics = r.analytics_id ? analyticsMap.get(r.analytics_id as string) : undefined;

      // Prefer direct calls.ai_* columns (written by process-call after 42704 fix);
      // fall back to joined call_analytics data for older rows.
      const aiSentiment = (r as Record<string, unknown>).ai_sentiment as string | null
        ?? analytics?.sentiment ?? null;
      const aiSentimentScore = (r as Record<string, unknown>).ai_sentiment_score as number | null
        ?? analytics?.sentiment_score ?? null;
      const aiSummaryRaw = (r as Record<string, unknown>).ai_summary ?? analytics?.summary ?? null;
      const aiNextStepsRaw = (r as Record<string, unknown>).ai_next_steps ?? analytics?.next_steps ?? null;
      const rawKeywords = (r as Record<string, unknown>).ai_keywords ?? analytics?.talking_points ?? null;
      const rawObjections = (r as Record<string, unknown>).ai_objections ?? analytics?.objections ?? null;

      return {
        id: r.id,
        recording_url: r.recording_url,
        duration_seconds: r.duration_seconds,
        transcript: r.transcript,
        started_at: r.started_at,
        disposition: r.disposition,
        was_recorded: r.was_recorded,
        from_number: r.from_number,
        to_number: r.to_number,
        direction: r.direction,
        ai_processing_status: (r.ai_processing_status as string | null) ?? null,
        analytics_id: (r.analytics_id as string | null) ?? null,
        ai_processed: r.ai_processed ?? false,
        lead_id: r.lead_id,
        leads: r.leads as unknown as { first_name: string | null; last_name: string | null; company: string | null } | null,
        ai_sentiment: aiSentiment,
        ai_sentiment_score: aiSentimentScore,
        ai_summary_raw: aiSummaryRaw,
        ai_next_steps_raw: aiNextStepsRaw,
        ai_keywords: Array.isArray(rawKeywords) ? (rawKeywords as string[]) : null,
        ai_objections: Array.isArray(rawObjections) ? (rawObjections as string[]) : null,
      };
    });

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

    console.log('[RECORDINGS-LIST]', user.email, 'count:', enriched.length, '| with AI:', analyticsIds.length);
    return NextResponse.json({ recordings: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RECORDINGS-LIST] Crash:', msg);
    return NextResponse.json({ error: msg, recordings: [] }, { status: 500 });
  }
}
