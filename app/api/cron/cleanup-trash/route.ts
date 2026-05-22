import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: toDelete, error: fetchError } = await supabase
    .from('leads')
    .select('id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', sevenDaysAgo);

  if (fetchError) {
    console.error('[CRON-TRASH] Fetch error:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const ids = (toDelete ?? []).map((l) => l.id);

  if (ids.length > 0) {
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('[CRON-TRASH] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  console.log('[CRON-TRASH] Permanently deleted:', ids.length, 'leads');
  return NextResponse.json({ deleted: ids.length });
}
