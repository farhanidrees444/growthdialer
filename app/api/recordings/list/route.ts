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
        id, recording_url, duration_seconds, transcript,
        started_at, disposition, was_recorded, ai_processing_status,
        analytics_id, from_number, to_number,
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

    const rows = calls ?? [];

    // Batch-fetch analytics (no FK constraint, so manual join)
    const analyticsIds = rows
      .map((r) => r.analytics_id as string | null)
      .filter(Boolean) as string[];

    const analyticsMap: Record<string, Record<string, unknown>> = {};
    if (analyticsIds.length > 0) {
      const { data: analyticsRows } = await supabase
        .from('call_analytics')
        .select('id, sentiment, sentiment_score, summary, next_steps, talking_points, objections')
        .in('id', analyticsIds);
      for (const row of analyticsRows ?? []) {
        analyticsMap[row.id as string] = row as Record<string, unknown>;
      }
    }

    let enriched = rows.map((r) => {
      const a = r.analytics_id ? analyticsMap[r.analytics_id as string] : null;
      return {
        ...r,
        ai_sentiment: (a?.sentiment as string | null) ?? null,
        ai_sentiment_score: (a?.sentiment_score as number | null) ?? null,
        ai_summary_raw: a?.summary ?? null,
        ai_next_steps_raw: a?.next_steps ?? null,
        ai_keywords: Array.isArray(a?.talking_points) ? a.talking_points : null,
        ai_objections: Array.isArray(a?.objections) ? a.objections : null,
      };
    });

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
