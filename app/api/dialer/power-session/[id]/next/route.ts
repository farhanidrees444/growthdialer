import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import {
  countDialerQueueLeads,
  fetchDialerQueueLeads,
  normalizeQueueConfig,
  type DialerQueueConfig,
} from '@/lib/dialer/queue-query';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      excludeLeadId?: string;
      calledLeadIds?: string[];
      current_disposition?: string;
      workspace_id?: string;
      queue_config?: DialerQueueConfig;
    };
    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const userId = user.id;
    const { excludeLeadId, calledLeadIds = [], queue_config } = body;

    const { data: powerSession } = await supabase
      .from('power_dial_sessions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!powerSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (powerSession.status !== 'active') {
      return NextResponse.json({ nextLead: null, done: true });
    }

    const excluded = [...calledLeadIds];
    if (excludeLeadId && !excluded.includes(excludeLeadId)) excluded.push(excludeLeadId);

    const queueConfig: DialerQueueConfig = {
      tab: 'queue',
      sort: 'priority',
      ...queue_config,
      excludeIds: excluded,
      limit: 1,
      offset: 0,
    };

    const { data: leads, error: queueError } = await fetchDialerQueueLeads(
      supabase,
      access.workspaceId,
      queueConfig,
    );

    if (queueError) throw queueError;

    const nextLead = leads?.[0] ?? null;

    if (!nextLead) {
      return NextResponse.json({
        ended: true,
        reason: 'queue_empty',
        nextLead: null,
        done: true,
        queue_remaining: 0,
      });
    }

    const allExcluded = [...excluded, nextLead.id];
    const countConfig = normalizeQueueConfig({
      tab: 'queue',
      sort: 'priority',
      ...queue_config,
      excludeIds: allExcluded,
    });
    const { count, error: countError } = await countDialerQueueLeads(
      supabase,
      access.workspaceId,
      countConfig,
    );
    if (countError) throw countError;

    return NextResponse.json({
      next_lead: nextLead,
      nextLead,
      queue_remaining: count ?? 0,
      done: false,
      ended: false,
    });
  } catch (err) {
    console.error('[power-session/next]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
