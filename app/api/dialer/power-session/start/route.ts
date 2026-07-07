import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { assertUserCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import {
  countDialerQueueLeads,
  fetchDialerQueueLeads,
  type DialerQueueConfig,
} from '@/lib/dialer/queue-query';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({})) as {
      delay_seconds?: number;
      auto_stop_after?: number;
      skip_after_disposition?: string[];
      workspace_id?: string;
      queue_config?: DialerQueueConfig;
    };
    const { delay_seconds = 5, auto_stop_after, skip_after_disposition, queue_config } = body;
    void auto_stop_after;
    void skip_after_disposition;

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const billingBlock = await assertUserCanPlaceCalls(supabase, user.id);
    if (billingBlock) return billingBlock;

    const userId = user.id;

    await supabase
      .from('power_dial_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data: powerSession, error: sessionError } = await supabase
      .from('power_dial_sessions')
      .insert({ user_id: userId, status: 'active' })
      .select('id, started_at, total_calls, connected_calls, meetings_booked, total_talk_time, status')
      .single();

    if (sessionError || !powerSession) {
      console.error('[power-session/start]', sessionError);
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    const queueConfig: DialerQueueConfig = {
      tab: 'queue',
      sort: 'priority',
      ...queue_config,
      limit: 1,
      offset: 0,
    };

    const { data: leads, error: queueError } = await fetchDialerQueueLeads(
      supabase,
      userId,
      queueConfig,
    );

    if (queueError) throw queueError;

    const firstLead = leads?.[0] ?? null;

    const { count: queueSize, error: countError } = await countDialerQueueLeads(
      supabase,
      userId,
      { ...queueConfig, limit: undefined, offset: undefined },
    );
    if (countError) throw countError;

    return NextResponse.json({
      session: powerSession,
      session_id: powerSession.id,
      firstLead,
      first_lead: firstLead,
      queueSize: queueSize ?? 0,
      queue_size: queueSize ?? 0,
      delay_seconds,
    });
  } catch (err) {
    console.error('[power-session/start]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
