import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { triggerProcessCallAsync } from '@/lib/ai/trigger-process-call';
import { AI_PROCESSING_STALE_MS } from '@/lib/ai/pipeline-status';
import { PLAYABLE_RECORDING_DURATION_FILTER } from '@/lib/recordings/eligibility';

export const dynamic = 'force-dynamic';

const BATCH_LIMIT = 20;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  if (!process.env.INTERNAL_API_SECRET?.trim()) {
    return NextResponse.json({ error: 'INTERNAL_API_SECRET not configured' }, { status: 503 });
  }

  const staleBefore = new Date(Date.now() - AI_PROCESSING_STALE_MS).toISOString();

  const { data: pendingOrFailed, error: q1Err } = await supabase
    .from('calls')
    .select('id')
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER)
    .eq('ai_processed', false)
    .in('ai_processing_status', ['pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (q1Err) {
    console.error('[CRON-AI] pending/failed query error:', q1Err);
    return NextResponse.json({ error: q1Err.message }, { status: 500 });
  }

  const { data: staleProcessing, error: q2Err } = await supabase
    .from('calls')
    .select('id')
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER)
    .eq('ai_processed', false)
    .eq('ai_processing_status', 'processing')
    .lt('ai_processed_at', staleBefore)
    .order('ai_processed_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (q2Err) {
    console.error('[CRON-AI] stale processing query error:', q2Err);
    return NextResponse.json({ error: q2Err.message }, { status: 500 });
  }

  const ids = [...new Set([
    ...(pendingOrFailed ?? []).map((r) => r.id),
    ...(staleProcessing ?? []).map((r) => r.id),
  ])].slice(0, BATCH_LIMIT);

  for (const id of ids) {
    triggerProcessCallAsync(id, '[CRON-AI]');
  }

  return NextResponse.json({
    ok: true,
    queued: ids.length,
    call_ids: ids,
  });
}
