import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { mirrorCallRecordingToStorage } from '@/lib/recordings/storage';

export const dynamic = 'force-dynamic';

const BATCH_LIMIT = 15;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  const { data: rows, error } = await supabase
    .from('calls')
    .select('id, user_id, recording_url, recording_supabase_path')
    .not('recording_url', 'is', null)
    .is('recording_supabase_path', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error('[CRON-MIRROR] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { call_id: string; ok: boolean; error?: string }[] = [];

  for (const row of rows ?? []) {
    const mirrored = await mirrorCallRecordingToStorage(supabase, {
      callId: row.id,
      userId: row.user_id,
      recordingUrl: row.recording_url as string,
    });
    results.push({
      call_id: row.id,
      ok: mirrored.ok,
      error: mirrored.ok ? undefined : mirrored.error,
    });
  }

  return NextResponse.json({
    ok: true,
    attempted: results.length,
    mirrored: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
