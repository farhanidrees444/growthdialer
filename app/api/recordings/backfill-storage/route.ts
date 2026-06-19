import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { mirrorCallRecordingToStorage } from '@/lib/recordings/storage';
import { MIN_PLAYABLE_RECORDING_SECONDS } from '@/lib/recordings/eligibility';

const MAX_BATCH = 10;

/**
 * POST /api/recordings/backfill-storage
 * Mirror existing Telnyx recording_url rows into call-recordings bucket.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 });
  }

  let limit = MAX_BATCH;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.limit === 'number' && body.limit > 0 && body.limit <= 25) {
      limit = body.limit;
    }
  } catch {
    // default
  }

  const { data: rows, error } = await supabase
    .from('calls')
    .select('id, recording_url, recording_supabase_path')
    .eq('user_id', user.id)
    .not('recording_url', 'is', null)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`)
    .is('recording_supabase_path', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { call_id: string; ok: boolean; path?: string; error?: string }[] = [];

  for (const row of rows ?? []) {
    const mirrored = await mirrorCallRecordingToStorage(service, {
      callId: row.id,
      userId: user.id,
      recordingUrl: row.recording_url as string,
      existingPath: row.recording_supabase_path,
    });
    results.push({
      call_id: row.id,
      ok: mirrored.ok,
      path: mirrored.ok ? mirrored.path : undefined,
      error: mirrored.ok ? undefined : mirrored.error,
    });
  }

  return NextResponse.json({
    mirrored: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    hint: results.length === 0
      ? 'All recordings already mirrored to storage'
      : 'Playback now uses signed URLs from your call-recordings bucket',
  });
}
