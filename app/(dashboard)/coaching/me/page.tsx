import { createClient } from '@/lib/supabase/server';
import { AgentSelfView } from '@/components/coaching/AgentSelfView';
import type { CoachingCall, CoachingScore, WeeklyReport } from '@/components/coaching/types';

export const dynamic = 'force-dynamic';

function currentWeekStart(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function leadName(lead: { first_name?: string | null; last_name?: string | null; company?: string | null } | null | undefined): string {
  return [lead?.first_name, lead?.last_name].filter(Boolean).join(' ') || lead?.company || 'Prospect';
}

export default async function MyCoachingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <main className="flex-1 p-6 text-sm text-slate-400">Sign in to view your coaching.</main>;
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!member) {
    return <main className="flex-1 p-6 text-sm text-slate-400">No active workspace found.</main>;
  }

  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 45);
  const since = sinceDate.toISOString();
  const [{ data: scores }, { data: calls }, { data: report }] = await Promise.all([
    supabase
      .from('call_scores')
      .select('id, call_id, agent_id, total_score, rubric_breakdown, ai_summary, key_moments, coachable_moments, scored_at')
      .eq('workspace_id', member.workspace_id)
      .eq('agent_id', user.id)
      .gte('scored_at', since)
      .order('scored_at', { ascending: false }),
    supabase
      .from('calls')
      .select('id, user_id, lead_id, started_at, duration_seconds, disposition')
      .eq('workspace_id', member.workspace_id)
      .eq('user_id', user.id)
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(100),
    supabase
      .from('coaching_reports')
      .select('id, week_start, week_end, strengths, improvements, drill, summary')
      .eq('workspace_id', member.workspace_id)
      .eq('agent_id', user.id)
      .eq('week_start', currentWeekStart())
      .maybeSingle(),
  ]);

  const leadIds = Array.from(new Set((calls ?? []).map((call) => call.lead_id).filter(Boolean))) as string[];
  const { data: leads } = leadIds.length
    ? await supabase.from('leads').select('id, first_name, last_name, company').in('id', leadIds)
    : { data: [] };
  const leadMap = new Map((leads ?? []).map((lead) => [lead.id, lead]));
  const scoreByCall = new Map(((scores ?? []) as CoachingScore[]).map((score) => [score.call_id, score.total_score]));

  const callRows: CoachingCall[] = (calls ?? []).map((call) => {
    const lead = call.lead_id ? leadMap.get(call.lead_id) : null;
    return {
      id: call.id,
      agent_id: call.user_id,
      prospect_name: leadName(lead),
      prospect_company: lead?.company ?? null,
      started_at: call.started_at,
      duration_seconds: call.duration_seconds,
      disposition: call.disposition,
      score: scoreByCall.get(call.id) ?? null,
    };
  });

  return (
    <AgentSelfView
      scores={(scores ?? []) as CoachingScore[]}
      calls={callRows}
      report={(report ?? null) as WeeklyReport | null}
    />
  );
}
