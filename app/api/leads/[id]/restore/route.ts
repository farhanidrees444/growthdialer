import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('[LEADS-RESTORE] Restoring lead:', id, 'user:', userId);

    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[LEADS-RESTORE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[LEADS-RESTORE] Success');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LEADS-RESTORE] Exception:', error);
    return NextResponse.json({ error: 'Unable to restore lead' }, { status: 500 });
  }
}
