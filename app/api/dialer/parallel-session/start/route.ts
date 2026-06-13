import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { assertWorkspaceCanPlaceCalls } from '@/lib/billing/workspace-billing-gate';
import { apiUnauthorized } from '@/lib/api/errors';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import { dialParallelBatch } from '@/lib/parallel-dial/dial-batch';
import { clampParallelLines } from '@/lib/parallel-dial/architecture';
import type { ParallelDialSession } from '@/lib/parallel-dial/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const body = await request.json().catch(() => ({})) as {
      lines_count?: number;
      amd_enabled?: boolean;
      vm_drop_enabled?: boolean;
      workspace_id?: string;
      queue_config?: DialerQueueConfig;
      auto_dial?: boolean;
    };

    const lines_count = clampParallelLines(body.lines_count);

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;
    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const billingBlock = await assertWorkspaceCanPlaceCalls(supabase, access.workspaceId);
    if (billingBlock) return billingBlock;

    await supabase
      .from('parallel_dial_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('status', ['active', 'paused', 'dialing', 'connected', 'disposition']);

    const { data: session, error } = await supabase
      .from('parallel_dial_sessions')
      .insert({
        user_id: user.id,
        workspace_id: access.workspaceId,
        lines_count,
        amd_enabled: body.amd_enabled ?? false,
        vm_drop_enabled: body.vm_drop_enabled ?? true,
        queue_config: body.queue_config ?? { tab: 'queue', sort: 'priority' },
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !session) {
      console.error('[parallel-session/start]', error);
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    let legs: unknown[] = [];
    if (body.auto_dial !== false) {
      const batch = await dialParallelBatch(
        supabase,
        session as ParallelDialSession,
        user.id,
      );
      legs = batch.legs;
    }

    const { data: refreshed } = await supabase
      .from('parallel_dial_sessions')
      .select('*')
      .eq('id', session.id)
      .single();

    return NextResponse.json({
      session: refreshed ?? session,
      legs,
    });
  } catch (err) {
    console.error('[parallel-session/start]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
