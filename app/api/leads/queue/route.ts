import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '25');
    const status = url.searchParams.get('status') ?? 'queued';
    const offset = Math.max(page - 1, 0) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null);

    if (status !== 'all') {
      query = query.in('status', status.split(',').map((value) => value.trim()).filter(Boolean));
    }

    const { data, count, error } = await query
      .order('ai_score', { ascending: false, nullsFirst: false })
      .order('last_called_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Lead queue query failed:', error);
      return NextResponse.json({ error: 'Unable to fetch lead queue' }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [], count: count ?? 0, page, limit });
  } catch (error) {
    console.error('Lead queue error:', error);
    return NextResponse.json({ error: 'Unable to fetch leads' }, { status: 500 });
  }
}
