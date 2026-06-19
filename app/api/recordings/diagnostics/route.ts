import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAppBaseUrl } from '@/lib/ai/trigger-process-call';
import { AI_PROCESSING_STALE_MS } from '@/lib/ai/pipeline-status';
import { MIN_PLAYABLE_RECORDING_SECONDS } from '@/lib/recordings/eligibility';

// GET /api/recordings/diagnostics
// Authenticated. Returns a checklist that explains exactly why the recordings
// page may be empty for the calling user. Designed to be hit once after a test
// call to see where the pipeline is failing.
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Internal pipeline configuration (generic keys only — never vendor names)
  const appBaseUrl = resolveAppBaseUrl();
  const env = {
    voice_provider: !!process.env.TELNYX_API_KEY,
    voice_connection: !!process.env.TELNYX_CONNECTION_ID,
    webhook_signature: !!process.env.TELNYX_PUBLIC_KEY,
    app_url: !!appBaseUrl,
    app_url_value: appBaseUrl || null,
    internal_pipeline: !!process.env.INTERNAL_API_SECRET,
    transcription: !!process.env.GROQ_API_KEY,
    call_analysis: !!process.env.GEMINI_API_KEY,
    database_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // 2. User recording preferences
  const { data: settings } = await supabase
    .from('user_settings')
    .select('recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize')
    .eq('user_id', user.id)
    .maybeSingle();

  // 3. Counts: total calls, calls with recording_url, calls long enough
  const { count: totalCalls } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: withUrl } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recording_url', 'is', null)
    .not('recording_supabase_path', 'is', null)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`);

  const { count: longEnough } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`);

  const { count: recordedFlag } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('was_recorded', true);

  const { count: aiCompleted } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('ai_processed', true);

  const { count: aiPending } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recording_url', 'is', null)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`)
    .in('ai_processing_status', ['pending', 'processing']);

  const { count: aiFailed } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('ai_processing_status', 'failed');

  const { count: mirroredToStorage } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recording_supabase_path', 'is', null);

  const { count: needsMirror } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recording_url', 'is', null)
    .or(`recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS}`)
    .is('recording_supabase_path', null);

  const staleBefore = new Date(Date.now() - AI_PROCESSING_STALE_MS).toISOString();
  const { count: aiStuck } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('ai_processing_status', 'processing')
    .lt('ai_processed_at', staleBefore);

  // 4. Most recent 5 calls — show what state they are in
  const { data: recent } = await supabase
    .from('calls')
    .select(
      'id, created_at, status, duration_seconds, was_recorded, recording_url, recording_supabase_path, ai_processing_status, ai_error, hangup_cause',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // 5. Generate a human-readable diagnosis
  const issues: string[] = [];

  if (!env.voice_provider) issues.push('Voice provider is not configured — recordings cannot be started.');
  if (!env.webhook_signature) {
    issues.push(
      'Webhook signature key is not configured — production voice webhooks may be rejected.',
    );
  }
  if (!env.app_url) {
    issues.push('Application URL is not configured — set APP_URL or NEXT_PUBLIC_APP_URL so AI can be triggered.');
  }
  if (!env.database_service)
    issues.push('Database service is not configured — webhooks cannot persist call data.');
  if (!env.transcription) issues.push('Transcription service is not configured.');
  if (!env.call_analysis) issues.push('Call analysis service is not configured — summaries may be limited.');

  if (settings?.recording_mode === 'never') {
    issues.push("Settings → Calling → Recording mode is 'never'. Set it to 'always' to record.");
  }

  if (totalCalls && totalCalls > 0) {
    if (recordedFlag === 0) {
      issues.push(
        'You have calls but none are marked as recorded. Verify your voice webhook URL is configured in your telephony provider settings.',
      );
    } else if (withUrl === 0) {
      issues.push(
        'Calls are marked recorded but no playable recording URL was saved. Check call recording is enabled in your voice service.',
      );
    }
  }

  if (longEnough === 0 && totalCalls && totalCalls > 0) {
    issues.push(
      `None of your ${totalCalls} calls reached 30 seconds duration. Recordings under 30s are auto-discarded. Make a longer test call.`,
    );
  }

  if ((withUrl ?? 0) > 0 && (aiCompleted ?? 0) === 0 && (aiPending ?? 0) === 0) {
    issues.push(
      'Recordings exist but none completed AI analysis. Retry the AI queue or check AI service keys.',
    );
  }

  if ((aiStuck ?? 0) > 0) {
    issues.push(
      `${aiStuck} recording(s) stuck in processing >12 min — cron or POST /api/recordings/backfill-ai will retry.`,
    );
  }

  if ((aiFailed ?? 0) > 0) {
    issues.push(`${aiFailed} recording(s) failed AI — open Recent calls for ai_error, then reprocess from Recordings.`);
  }

  if ((withUrl ?? 0) > 0 && (needsMirror ?? 0) > 0) {
    issues.push(
      `${needsMirror} recording(s) not yet mirrored to storage — POST /api/recordings/backfill-storage or wait for cron.`,
    );
  }

  return NextResponse.json({
    ok: issues.length === 0,
    summary: {
      total_calls: totalCalls ?? 0,
      calls_with_recording_url: withUrl ?? 0,
      calls_marked_was_recorded: recordedFlag ?? 0,
      calls_over_30s: longEnough ?? 0,
      ai_completed: aiCompleted ?? 0,
      ai_pending_or_processing: aiPending ?? 0,
      ai_failed: aiFailed ?? 0,
      ai_stuck_processing: aiStuck ?? 0,
      mirrored_to_storage: mirroredToStorage ?? 0,
      pending_storage_mirror: needsMirror ?? 0,
    },
    env,
    settings: settings ?? { note: 'No user_settings row — using defaults (recording_mode=always)' },
    recent_calls: recent ?? [],
    issues,
    actions: {
      backfill_ai: 'POST /api/recordings/backfill-ai',
      backfill_storage: 'POST /api/recordings/backfill-storage',
      reprocess_one: 'POST /api/recordings/{call_id}/reprocess',
      playback_url: 'GET /api/recordings/{call_id}/playback',
    },
    next_step:
      issues.length === 0
        ? 'Pipeline looks healthy. Make a test call over 30 seconds and refresh /recordings within 60s.'
        : 'Fix the issues above. Most common: voice webhook URL not configured.',
  });
}
