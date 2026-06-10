import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { ownCallsOrFilter } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

const MODE_LABELS: Record<string, string> = {
  browser: 'Ring in Browser',
  forward: 'Forward to Phone',
  voicemail: 'Voicemail Only',
  off: 'Reject All',
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'VIEW_OWN_RECORDINGS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const wsId = access.workspaceId;

  const [settingsRes, numbersRes, callsRes] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode, inbound_forward_number, inbound_ring_seconds, missed_call_notify')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, is_default, status, label')
      .eq('user_id', user.id)
      .neq('status', 'released')
      .order('is_default', { ascending: false }),
    supabase
      .from('calls')
      .select('id, status, disposition, answered_at, started_at, created_at')
      .eq('direction', 'inbound')
      .or(ownCallsOrFilter(wsId, user.id))
      .order('started_at', { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  const settings = settingsRes.data;
  const numbers = numbersRes.data ?? [];
  const calls = callsRes.data ?? [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const missedCount = calls.filter((c) => {
    if (c.disposition === 'missed') return true;
    return !c.answered_at && ['missed', 'no_answer', 'canceled', 'failed', 'rejected'].includes(c.status ?? '');
  }).length;

  const todayInbound = calls.filter((c) => {
    const ts = c.started_at ?? c.created_at;
    return ts && new Date(ts) >= todayStart;
  }).length;

  const answeredToday = calls.filter((c) => {
    const ts = c.started_at ?? c.created_at;
    return c.answered_at && ts && new Date(ts) >= todayStart;
  }).length;

  const mode = (settings?.inbound_mode as string | null) ?? 'browser';
  const primary = numbers.find((n) => n.is_default) ?? numbers[0] ?? null;

  return NextResponse.json({
    inbound_mode: mode,
    inbound_mode_label: MODE_LABELS[mode] ?? 'Ring in Browser',
    inbound_forward_number: settings?.inbound_forward_number ?? null,
    inbound_ring_seconds: settings?.inbound_ring_seconds ?? 25,
    missed_call_notify: settings?.missed_call_notify ?? true,
    numbers,
    has_numbers: numbers.length > 0,
    missed_count: missedCount,
    today_inbound: todayInbound,
    answered_today: answeredToday,
    primary_number: primary?.phone_number ?? null,
  });
}
