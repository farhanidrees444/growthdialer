import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import {
  fetchDialerQueueCounts,
  fetchDialerQueueLeads,
  type DialerQueueFilters,
} from '@/lib/dialer/queue-query';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const { searchParams } = new URL(request.url);
    const tab = (searchParams.get('tab') ?? 'queue') as 'queue' | 'hot' | 'callbacks';
    const search = searchParams.get('search') ?? '';
    const sort = (searchParams.get('sort') ?? 'priority') as 'priority' | 'recent' | 'az' | 'tz_safe';
    const limit = parseInt(searchParams.get('limit') ?? '500', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    let filters: DialerQueueFilters = {};
    try {
      const raw = searchParams.get('filters');
      if (raw) filters = JSON.parse(raw) as DialerQueueFilters;
    } catch { /* malformed JSON — ignore */ }

    const { data, error } = await fetchDialerQueueLeads(supabase, userId, {
      tab,
      search,
      sort,
      filters,
      limit,
      offset,
    });

    if (error) throw error;

    const counts = await fetchDialerQueueCounts(supabase, userId);

    return NextResponse.json({
      leads: data ?? [],
      total: data?.length ?? 0,
      counts,
    });
  } catch (err) {
    console.error('[dialer/queue]', err);
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 });
  }
}
