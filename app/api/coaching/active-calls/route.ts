import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { fetchLiveWorkspaceCalls } from '@/lib/coaching/active-calls-query';

export const dynamic = 'force-dynamic';

// GET /api/coaching/active-calls — list active calls in the workspace for coaching
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user's workspace membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (!member || !hasPermission(member.role as Role, 'COACH_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const calls = await fetchLiveWorkspaceCalls(supabase, member.workspace_id);

  if (!calls.length) return NextResponse.json({ calls: [] });

  // Enrich with agent name + lead info
  const userIds = [...new Set(calls.map((c) => c.user_id).filter(Boolean))];
  const leadIds = [...new Set(calls.map((c) => c.lead_id).filter(Boolean))];

  const [{ data: leads }, agentMap] = await Promise.all([
    leadIds.length
      ? supabase.from('leads').select('id, first_name, last_name, company').in('id', leadIds)
      : Promise.resolve({ data: [] }),
    fetchAgentNames(supabase, userIds),
  ]);

  const leadMap = new Map((leads ?? []).map((l) => [l.id, l]));

  // Get active coaching sessions for these calls
  const callIds = calls.map((c) => c.id);
  const { data: coachingSessions } = await supabase
    .from('coaching_sessions')
    .select('call_id, coach_id, mode')
    .in('call_id', callIds)
    .is('ended_at', null);

  const coachMap = new Map(
    (coachingSessions ?? []).map((s) => [s.call_id, { coach_id: s.coach_id, mode: s.mode }]),
  );

  const enriched = calls.map((call) => {
    const lead = call.lead_id ? leadMap.get(call.lead_id) : null;
    const agent = agentMap.get(call.user_id) ?? { email: '', full_name: '' };
    const coaching = coachMap.get(call.id) ?? null;
    return {
      ...call,
      agent_email: agent.email,
      agent_name: agent.full_name || agent.email,
      lead_first_name: lead?.first_name ?? '',
      lead_last_name: lead?.last_name ?? '',
      lead_company: lead?.company ?? '',
      coaching,
    };
  });

  return NextResponse.json({ calls: enriched });
}

async function fetchAgentNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
): Promise<Map<string, { email: string; full_name: string }>> {
  if (!userIds.length) return new Map();
  // Use workspace_members to get available info (service role would be better for email)
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .in('user_id', userIds);

  const map = new Map<string, { email: string; full_name: string }>();
  (members ?? []).forEach((m) => {
    map.set(m.user_id, { email: '', full_name: 'Agent' });
  });
  return map;
}
