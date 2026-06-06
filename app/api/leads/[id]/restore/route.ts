import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    const { id } = await params;

    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id)
      .eq('workspace_id', access.workspaceId);

    if (error) {
      console.error('[LEADS-RESTORE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LEADS-RESTORE] Exception:', error);
    return NextResponse.json({ error: 'Unable to restore lead' }, { status: 500 });
  }
}
