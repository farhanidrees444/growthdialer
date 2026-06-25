import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { CoachingDashboard } from '@/components/coaching/CoachingDashboard';
import type { AgentRosterRow, CoachingCall, CoachingNote, CoachingScore } from '@/components/coaching/types';

export const dynamic = 'force-dynamic';

function weekStartIso(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function nameForLead(lead: { first_name?: string | null; last_name?: string | null; company?: string | null } | null | undefined, fallback = 'Prospect') {
  const name = [lead?.first_name, lead?.last_name].filter(Boolean).join(' ');
  return name || lead?.company || fallback;
}

export default async function CoachingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <main className="flex-1 p-6 text-sm text-slate-400">Sign in to view coaching.</main>;
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!member || !hasPermission(member.role as Role, 'COACH_CALLS')) {
    return <main className="flex-1 p-6 text-sm text-slate-400">Manager role or above is required for coaching dashboards.</main>;
  }

  const workspaceId = member.workspace_id as string;
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 30);
  const since30 = sinceDate.toISOString();
  const weekStart = weekStartIso();

  const [{ data: members }, { data: scores }, { data: calls }, { data: notes }] = await Promise.all([
    supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId).eq('status', 'active'),
    supabase
      .from('call_scores')
      .select('id, call_id, agent_id, total_score, rubric_breakdown, ai_summary, key_moments, coachable_moments, scored_at')
      .eq('workspace_id', workspaceId)
      .gte('scored_at', since30)
      .order('scored_at', { ascending: false }),
    supabase
      .from('calls')
      .select('id, user_id, lead_id, started_at, duration_seconds, disposition')
      .eq('workspace_id', workspaceId)
      .gte('started_at', since30)
      .order('started_at', { ascending: false })
      .limit(250),
    supabase
      .from('coaching_notes')
      .select('id, call_id, agent_id, coach_id, note, visible_to_agent, updated_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(100),
  ]);

  const memberRows = members ?? [];
  const memberIds = memberRows.map((row) => row.user_id as string);
  const profileMap = new Map<string, { full_name: string }>();
  const service = createServiceClient();
  if (service && memberIds.length) {
    const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
    for (const profile of data?.users ?? []) {
      if (memberIds.includes(profile.id)) {
        profileMap.set(profile.id, {
          full_name: (profile.user_metadata?.full_name as string | undefined) ?? profile.email?.split('@')[0] ?? 'Agent',
        });
      }
    }
  }

  const leadIds = Array.from(new Set((calls ?? []).map((call) => call.lead_id).filter(Boolean))) as string[];
  const { data: leads } = leadIds.length
    ? await supabase.from('leads').select('id, first_name, last_name, company').in('id', leadIds)
    : { data: [] };
  const leadMap = new Map((leads ?? []).map((lead) => [lead.id, lead]));

  const scoreRows = (scores ?? []) as CoachingScore[];
  const scoresByAgent: Record<string, CoachingScore[]> = {};
  const callsByAgent: Record<string, CoachingCall[]> = {};
  const notesByAgent: Record<string, CoachingNote[]> = {};
  const scoreByCall = new Map(scoreRows.map((score) => [score.call_id, score.total_score]));

  for (const score of scoreRows) {
    scoresByAgent[score.agent_id] = [...(scoresByAgent[score.agent_id] ?? []), score];
  }
  for (const note of (notes ?? []) as CoachingNote[]) {
    notesByAgent[note.agent_id] = [...(notesByAgent[note.agent_id] ?? []), note];
  }
  for (const call of calls ?? []) {
    const lead = call.lead_id ? leadMap.get(call.lead_id) : null;
    const row: CoachingCall = {
      id: call.id,
      agent_id: call.user_id,
      prospect_name: nameForLead(lead),
      prospect_company: lead?.company ?? null,
      started_at: call.started_at,
      duration_seconds: call.duration_seconds,
      disposition: call.disposition,
      score: scoreByCall.get(call.id) ?? null,
    };
    callsByAgent[row.agent_id] = [...(callsByAgent[row.agent_id] ?? []), row];
  }

  const roster: AgentRosterRow[] = memberRows.map((row) => {
    const agentId = row.user_id as string;
    const agentScores = scoresByAgent[agentId] ?? [];
    const avg = Math.round(agentScores.reduce((sum, score) => sum + score.total_score, 0) / Math.max(1, agentScores.length));
    return {
      agent_id: agentId,
      full_name: profileMap.get(agentId)?.full_name ?? 'Agent',
      role: row.role as string,
      avg_score: avg,
      calls_this_week: (callsByAgent[agentId] ?? []).filter((call) => call.started_at && call.started_at >= weekStart).length,
      trend: agentScores.slice(0, 8).reverse().map((score, index) => ({ label: `${index + 1}`, score: score.total_score })),
    };
  });

  return (
    <CoachingDashboard
      workspaceId={workspaceId}
      roster={roster}
      scoresByAgent={scoresByAgent}
      callsByAgent={callsByAgent}
      notesByAgent={notesByAgent}
    />
  );
}
