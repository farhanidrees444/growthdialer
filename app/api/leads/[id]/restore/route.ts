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
    const restoredAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('leads')
      .update({ deleted_at: null, deleted_by: null, updated_at: restoredAt })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, deleted_at')
      .maybeSingle();

    if (error) {
      console.error('[LEADS-RESTORE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Lead not found or could not be restored' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    console.error('[LEADS-RESTORE] Exception:', error);
    return NextResponse.json({ error: 'Unable to restore lead' }, { status: 500 });
  }
}
