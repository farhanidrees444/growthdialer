// @ts-nocheck
import { createServiceClient, json, requireInternalAuth, weekWindow } from '../_shared/coaching.ts';

type ScoreRow = {
  workspace_id: string;
  agent_id: string;
  total_score: number;
  rubric_breakdown: Record<string, number>;
  scored_at: string;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authError = await requireInternalAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({})) as { workspace_id?: string; week_start?: string };
    const supabase = createServiceClient();
    const { start, end } = weekWindow(body.week_start ? new Date(`${body.week_start}T00:00:00Z`) : new Date());
    const prev = weekWindow(new Date(`${start}T00:00:00Z`).getTime() ? new Date(new Date(`${start}T00:00:00Z`).getTime() - 86400000) : new Date());

    let currentQuery = supabase
      .from('call_scores')
      .select('workspace_id, agent_id, total_score, rubric_breakdown, scored_at')
      .gte('scored_at', `${start}T00:00:00Z`)
      .lte('scored_at', `${end}T23:59:59Z`);
    let previousQuery = supabase
      .from('call_scores')
      .select('workspace_id, agent_id, total_score, rubric_breakdown, scored_at')
      .gte('scored_at', `${prev.start}T00:00:00Z`)
      .lte('scored_at', `${prev.end}T23:59:59Z`);

    if (body.workspace_id) {
      currentQuery = currentQuery.eq('workspace_id', body.workspace_id);
      previousQuery = previousQuery.eq('workspace_id', body.workspace_id);
    }

    const [{ data: current, error: currentError }, { data: previous, error: previousError }] = await Promise.all([
      currentQuery,
      previousQuery,
    ]);
    if (currentError) throw currentError;
    if (previousError) throw previousError;

    const byWorkspace = new Map<string, ScoreRow[]>();
    for (const row of (current ?? []) as ScoreRow[]) {
      byWorkspace.set(row.workspace_id, [...(byWorkspace.get(row.workspace_id) ?? []), row]);
    }

    const previousAvg = new Map<string, number>();
    for (const row of (previous ?? []) as ScoreRow[]) {
      const key = `${row.workspace_id}:${row.agent_id}`;
      const existing = previousAvg.get(key);
      previousAvg.set(key, existing == null ? row.total_score : (existing + row.total_score) / 2);
    }

    const savedBadges = [];
    for (const [workspaceId, rows] of byWorkspace.entries()) {
      const agents = new Map<string, ScoreRow[]>();
      for (const row of rows) agents.set(row.agent_id, [...(agents.get(row.agent_id) ?? []), row]);

      const aggregates = Array.from(agents.entries()).map(([agentId, agentRows]) => {
        const avg = agentRows.reduce((sum, r) => sum + Number(r.total_score ?? 0), 0) / agentRows.length;
        const opener = agentRows.reduce((sum, r) => sum + Number(r.rubric_breakdown?.opener_strength ?? 0), 0) / agentRows.length;
        const prevAvg = previousAvg.get(`${workspaceId}:${agentId}`) ?? avg;
        return { agentId, avg, opener, improvement: avg - prevAvg };
      });

      const winners = [
        { type: 'top_closer', label: 'Top Closer', winner: [...aggregates].sort((a, b) => b.avg - a.avg)[0], value: 'avg' },
        { type: 'most_improved', label: 'Most Improved', winner: [...aggregates].sort((a, b) => b.improvement - a.improvement)[0], value: 'improvement' },
        { type: 'best_opener', label: 'Best Opener', winner: [...aggregates].sort((a, b) => b.opener - a.opener)[0], value: 'opener' },
      ] as const;

      for (const item of winners) {
        if (!item.winner) continue;
        const metricValue = item.winner[item.value];
        const { data, error } = await supabase
          .from('leaderboard_badges')
          .upsert({
            workspace_id: workspaceId,
            agent_id: item.winner.agentId,
            week_start: start,
            week_end: end,
            badge_type: item.type,
            badge_label: item.label,
            metric_value: Math.round(metricValue * 100) / 100,
            metadata: { computed_from: rows.length },
            awarded_at: new Date().toISOString(),
          }, { onConflict: 'workspace_id,agent_id,week_start,badge_type' })
          .select()
          .single();
        if (error) throw error;
        savedBadges.push(data);
      }
    }

    return json({ ok: true, week_start: start, week_end: end, badges: savedBadges });
  } catch (err) {
    console.error('[compute_leaderboard_badges]', err);
    return json({ error: err instanceof Error ? err.message : 'Failed to compute badges' }, 500);
  }
});
