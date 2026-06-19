import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { createServiceClient } from '@/lib/supabase/service';
import { createCallRecordingSignedUrl } from '@/lib/recordings/storage';
import { PLAYABLE_RECORDING_DURATION_FILTER } from '@/lib/recordings/eligibility';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized', recordings: [] }, { status: 401 });

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (
      !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')
      && !hasPermission(access.role, 'VIEW_OWN_RECORDINGS')
    ) {
      return NextResponse.json({ error: 'Forbidden', recordings: [] }, { status: 403 });
    }

    const teamView = canViewTeamCalls(access);
    const wsId = access.workspaceId;

    const { searchParams } = new URL(request.url);
    const sentiment = searchParams.get('sentiment') ?? '';
    const search = searchParams.get('search') ?? '';

    let recordingsQuery = supabase
      .from('calls')
      .select(`
        id, recording_url, recording_supabase_path,
        duration_seconds, recording_duration_seconds, transcript, ai_summary, ai_sentiment, ai_sentiment_score,
        ai_keywords, ai_next_steps, ai_objections, ai_processing_status, ai_error,
        analytics_id, was_recorded,
        from_number, to_number, started_at, created_at, disposition, direction, lead_id,
        leads:lead_id (id, name, first_name, last_name, company, phone)
      `)
      .not('recording_url', 'is', null)
      .not('recording_supabase_path', 'is', null)
      .or(PLAYABLE_RECORDING_DURATION_FILTER)
      .order('started_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100);

    recordingsQuery = teamView
      ? recordingsQuery.eq('workspace_id', wsId)
      : recordingsQuery.or(ownCallsOrFilter(wsId, user.id));

    const { data: calls, error } = await recordingsQuery;

    if (error) {
      console.error('[RECORDINGS-LIST] DB error:', error);
      return NextResponse.json({ error: error.message, recordings: [] }, { status: 500 });
    }

    type LeadRow = {
      id?: string | null;
      name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      company?: string | null;
      phone?: string | null;
    } | null;

    let enriched = (calls ?? []).map((r) => {
      // Supabase can return `leads` as a single object OR an array depending on the FK shape.
      const rawLead = r.leads as LeadRow | LeadRow[] | null;
      const leadObj: LeadRow = Array.isArray(rawLead) ? (rawLead[0] ?? null) : rawLead;

      // Compose first_name / last_name from the singular `name` column when those
      // columns are empty (older imports only populate `name`).
      let firstName = leadObj?.first_name ?? null;
      let lastName = leadObj?.last_name ?? null;
      if (!firstName && !lastName && leadObj?.name) {
        const parts = leadObj.name.trim().split(/\s+/);
        firstName = parts[0] ?? null;
        lastName = parts.slice(1).join(' ') || null;
      }

      return {
        id: r.id,
        recording_url: r.recording_url,
        recording_supabase_path: r.recording_supabase_path ?? null,
        duration_seconds: r.recording_duration_seconds ?? r.duration_seconds,
        transcript: r.transcript,
        started_at: r.started_at ?? r.created_at,
        disposition: r.disposition,
        was_recorded: (r.was_recorded as boolean | null) ?? false,
        analytics_id: (r.analytics_id as string | null) ?? null,
        ai_processing_status: (r.ai_processing_status as string | null) ?? null,
        ai_error: (r.ai_error as string | null) ?? null,
        from_number: r.from_number,
        to_number: r.to_number,
        direction: r.direction,
        lead_id: r.lead_id,
        leads: leadObj
          ? { first_name: firstName, last_name: lastName, company: leadObj.company ?? null }
          : null,
        ai_sentiment: (r.ai_sentiment as string | null) ?? null,
        ai_sentiment_score: (r.ai_sentiment_score as number | null) ?? null,
        ai_summary_raw: r.ai_summary ?? null,
        ai_next_steps_raw: r.ai_next_steps ?? null,
        ai_keywords: Array.isArray(r.ai_keywords) ? (r.ai_keywords as string[]) : null,
        ai_objections: Array.isArray(r.ai_objections) ? (r.ai_objections as string[]) : null,
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

    const service = createServiceClient();
    const withPlayback = await Promise.all(
      enriched.map(async (r) => {
        let playback_url = r.recording_url as string;
        if (r.recording_supabase_path && service) {
          const signed = await createCallRecordingSignedUrl(
            service,
            r.recording_supabase_path as string,
          );
          if (signed) playback_url = signed;
        }
        return { ...r, playback_url };
      }),
    );

    console.log('[RECORDINGS-LIST]', user.email, 'returned:', withPlayback.length);
    return NextResponse.json({ recordings: withPlayback });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RECORDINGS-LIST] Crash:', msg);
    return NextResponse.json({ error: msg, recordings: [] }, { status: 500 });
  }
}
