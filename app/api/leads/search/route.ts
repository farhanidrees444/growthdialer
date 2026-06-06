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
    const query = (url.searchParams.get('q') ?? '').trim();
    const limit = Number(url.searchParams.get('limit') ?? '25');
    const offset = Number(url.searchParams.get('offset') ?? '0');

    let supabaseQuery = supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null);

    if (query) {
      const escapedQuery = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${escapedQuery}%,company.ilike.%${escapedQuery}%,email.ilike.%${escapedQuery}%,phone.ilike.%${escapedQuery}%`,
      );
    }

    const { data, error } = await supabaseQuery
      .order('ai_score', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Lead search failed:', error);
      return NextResponse.json({ error: 'Unable to search leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    console.error('Lead search error:', error);
    return NextResponse.json({ error: 'Unable to search leads' }, { status: 500 });
  }
}
