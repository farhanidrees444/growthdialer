import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

interface Filters {
  hasPhone?: boolean;
  hot?: boolean;
  callbacks?: boolean;
  hasNotes?: boolean;
  recentlyContacted?: boolean;
  // tzSafe intentionally omitted — applied client-side
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') ?? 'queue';
    const search = searchParams.get('search') ?? '';
    const sort = searchParams.get('sort') ?? 'priority';
    const limit = parseInt(searchParams.get('limit') ?? '500', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    let filters: Filters = {};
    try {
      const raw = searchParams.get('filters');
      if (raw) filters = JSON.parse(raw) as Filters;
    } catch { /* malformed JSON — ignore, use defaults */ }

    let query = supabase
      .from('leads')
      .select('id, name, title, company, phone, email, status, ai_score, last_called_at, call_attempts, tags, notes, dnc, user_id')
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null)
      .not('status', 'in', '("do_not_call","meeting_booked")')
      .eq('dnc', false);

    // Tab-based filtering
    if (tab === 'hot') {
      query = query.gte('ai_score', 70);
    } else if (tab === 'callbacks') {
      query = query.eq('status', 'callback');
    }

    // Additional server-side filters from the filter dropdown
    if (filters.hasPhone) {
      query = query.not('phone', 'is', null).neq('phone', '');
    }
    if (filters.hot && tab !== 'hot') {
      query = query.gte('ai_score', 70);
    }
    if (filters.callbacks && tab !== 'callbacks') {
      query = query.eq('status', 'callback');
    }
    if (filters.hasNotes) {
      query = query.not('notes', 'is', null).neq('notes', '');
    }
    if (filters.recentlyContacted) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('last_called_at', sevenDaysAgo);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    if (sort === 'priority' || sort === 'tz_safe') {
      query = query.order('ai_score', { ascending: false }).order('last_called_at', { ascending: true, nullsFirst: true });
    } else if (sort === 'recent') {
      query = query.order('last_called_at', { ascending: false, nullsFirst: false });
    } else if (sort === 'az') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('ai_score', { ascending: false });
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .returns<{
        id: string; name: string; title: string | null; company: string | null; phone: string;
        email: string | null; status: string; ai_score: number | null; last_called_at: string | null;
        call_attempts: number | null; tags: string[] | null; notes: string | null; dnc: boolean | null; user_id: string;
      }[]>();

    if (error) throw error;

    // Count hot + callbacks for tab badges
    const [{ count: hotCount }, { count: callbackCount }, { count: totalCount }] = await Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('status', 'in', '("do_not_call","meeting_booked")')
        .eq('dnc', false)
        .gte('ai_score', 70),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('status', 'callback'),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('status', 'in', '("do_not_call","meeting_booked")')
        .eq('dnc', false),
    ]);

    return NextResponse.json({
      leads: data ?? [],
      total: count ?? 0,
      counts: { queue: totalCount ?? 0, hot: hotCount ?? 0, callbacks: callbackCount ?? 0 },
    });
  } catch (err) {
    console.error('[dialer/queue]', err);
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 });
  }
}
