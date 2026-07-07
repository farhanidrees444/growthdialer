import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, apiForbidden } from '@/lib/api/errors';
import { assertUserCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import { dialParallelBatch } from '@/lib/parallel-dial/dial-batch';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { ParallelDialSession } from '@/lib/parallel-dial/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const body = await request.json().catch(() => ({})) as {
      exclude_lead_ids?: string[];
      queue_config?: DialerQueueConfig;
    };

    const { data: session } = await supabase
      .from('parallel_dial_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) return apiForbidden('Session not found');
    if (!['active', 'paused'].includes(session.status)) {
      return NextResponse.json({ error: 'Session not ready for dialing' }, { status: 400 });
    }

    const billingBlock = await assertUserCanPlaceCalls(supabase, user.id);
    if (billingBlock) return billingBlock;

    const { legs, leads } = await dialParallelBatch(
      supabase,
      session as ParallelDialSession,
      user.id,
      {
        excludeLeadIds: body.exclude_lead_ids,
        queueConfig: body.queue_config,
      },
    );

    const { data: refreshed } = await supabase
      .from('parallel_dial_sessions')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      session: refreshed,
      legs,
      leads_dialed: leads.length,
    });
  } catch (err) {
    console.error('[parallel-session/batch]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
