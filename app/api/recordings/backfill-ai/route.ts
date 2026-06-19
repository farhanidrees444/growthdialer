import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerProcessCall } from '@/lib/ai/trigger-process-call';
import { AI_PROCESSING_STALE_MS } from '@/lib/ai/pipeline-status';
import { MIN_PLAYABLE_RECORDING_SECONDS } from '@/lib/recordings/eligibility';

const MAX_BATCH = 10;

/**
 * POST /api/recordings/backfill-ai
 * Re-queues AI for the caller's recordings that have a URL but never finished analysis.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let limit = MAX_BATCH;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.limit === 'number' && body.limit > 0 && body.limit <= 25) {
      limit = body.limit;
    }
  } catch {
    // default limit
  }

  const staleBefore = new Date(Date.now() - AI_PROCESSING_STALE_MS).toISOString();

  const { data: rows, error } = await supabase
    .from('calls')
    .select('id, ai_processing_status, ai_processed_at')
    .eq('user_id', user.id)
    .not('recording_url', 'is', null)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`)
    .eq('ai_processed', false)
    .neq('ai_processing_status', 'skipped_short')
    .or(`ai_processing_status.in.(pending,failed),and(ai_processing_status.eq.processing,ai_processed_at.lt.${staleBefore})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[BACKFILL-AI] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { call_id: string; ok: boolean; detail?: string }[] = [];

  for (const row of rows ?? []) {
    await supabase
      .from('calls')
      .update({ ai_processing_status: 'pending', ai_error: null })
      .eq('id', row.id)
      .eq('user_id', user.id);

    const triggered = await triggerProcessCall(row.id);
    results.push({
      call_id: row.id,
      ok: triggered.ok,
      detail: triggered.ok ? `status ${triggered.status}` : triggered.detail,
    });
  }

  return NextResponse.json({
    queued: results.length,
    results,
    hint: results.length === 0
      ? 'No recordings need backfill — make a test call >30s or check /api/recordings/diagnostics'
      : 'Refresh /recordings in ~60s for transcripts and summaries',
  });
}
