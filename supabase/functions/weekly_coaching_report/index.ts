// @ts-nocheck
import { createServiceClient, geminiJson, json, requireInternalAuth, weekWindow } from '../_shared/coaching.ts';

type ReportPayload = {
  strengths: string[];
  improvements: string[];
  drill: { title: string; instructions: string; script?: string };
  summary: string;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authError = await requireInternalAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({})) as { workspace_id?: string; agent_id?: string; week_start?: string };
    const supabase = createServiceClient();
    const requestedStart = body.week_start ? new Date(`${body.week_start}T00:00:00Z`) : new Date();
    const { start, end } = weekWindow(requestedStart);

    let query = supabase
      .from('call_scores')
      .select('workspace_id, agent_id, total_score, rubric_breakdown, ai_summary, coachable_moments, scored_at')
      .gte('scored_at', `${start}T00:00:00Z`)
      .lte('scored_at', `${end}T23:59:59Z`)
      .order('scored_at', { ascending: false });

    if (body.workspace_id) query = query.eq('workspace_id', body.workspace_id);
    if (body.agent_id) query = query.eq('agent_id', body.agent_id);

    const { data: scores, error } = await query;
    if (error) throw error;

    const groups = new Map<string, typeof scores>();
    for (const score of scores ?? []) {
      const key = `${score.workspace_id}:${score.agent_id}`;
      groups.set(key, [...(groups.get(key) ?? []), score]);
    }

    const reports = [];
    for (const rows of groups.values()) {
      if (!rows?.length) continue;
      const sample = rows.slice(0, 10).map((row) => ({
        total_score: row.total_score,
        rubric_breakdown: row.rubric_breakdown,
        ai_summary: row.ai_summary,
        coachable_moments: row.coachable_moments,
      }));

      const report = await geminiJson<ReportPayload>(`Create a weekly sales coaching report from these call score records.
Return only JSON with exactly 3 strengths, exactly 3 improvements, one drill object, and a short summary.

Records:
${JSON.stringify(sample).slice(0, 22000)}`);

      const { data: saved, error: upsertError } = await supabase
        .from('coaching_reports')
        .upsert({
          workspace_id: rows[0].workspace_id,
          agent_id: rows[0].agent_id,
          week_start: start,
          week_end: end,
          strengths: (report.strengths ?? []).slice(0, 3),
          improvements: (report.improvements ?? []).slice(0, 3),
          drill: report.drill ?? {},
          summary: report.summary ?? '',
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'workspace_id,agent_id,week_start' })
        .select()
        .single();

      if (upsertError) throw upsertError;
      reports.push(saved);
    }

    return json({ ok: true, week_start: start, week_end: end, reports });
  } catch (err) {
    console.error('[weekly_coaching_report]', err);
    return json({ error: err instanceof Error ? err.message : 'Failed to generate reports' }, 500);
  }
});
