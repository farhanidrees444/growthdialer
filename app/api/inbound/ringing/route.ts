import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const select =
    'id, from_number, to_number, lead_id, status, direction, started_at, answered_at';

  let { data: call } = await supabase
    .from('calls')
    .select(select)
    .eq('user_id', user.id)
    .eq('direction', 'inbound')
    .eq('status', 'ringing')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Recover UI when bridge marked failed but WebRTC may still be ringing (race).
  if (!call) {
    const recentCutoff = new Date(Date.now() - 45_000).toISOString();
    const { data: recent } = await supabase
      .from('calls')
      .select(select)
      .eq('user_id', user.id)
      .eq('direction', 'inbound')
      .is('answered_at', null)
      .gte('started_at', recentCutoff)
      .in('status', ['ringing', 'failed'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      call = { ...recent, status: 'ringing' };
    }
  }

  if (!call) {
    return NextResponse.json({ call: null });
  }

  let lead: { first_name: string | null; last_name: string | null; company: string | null } | null = null;
  if (call.lead_id) {
    const { data } = await supabase
      .from('leads')
      .select('first_name, last_name, company')
      .eq('id', call.lead_id)
      .maybeSingle();
    lead = data ?? null;
  }

  return NextResponse.json({
    call: {
      id: call.id,
      from_number: call.from_number,
      to_number: call.to_number,
      lead_id: call.lead_id,
      status: call.status,
      lead,
    },
  });
}
