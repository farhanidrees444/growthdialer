import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { resolveAppBaseUrl } from '@/lib/ai/trigger-process-call';
import { AI_PROCESSING_STALE_MS } from '@/lib/ai/pipeline-status';
import {
  MIN_PLAYABLE_RECORDING_SECONDS,
  PLAYABLE_RECORDING_DURATION_FILTER,
} from '@/lib/recordings/eligibility';
import { isVoiceServiceConfigured, readVoiceWebhookSignatureReady, snapshotVoiceEnv } from '@/lib/voice/voice-readiness';

// GET /api/recordings/diagnostics
// Authenticated. Returns a checklist that explains exactly why the recordings
// page may be empty for the calling user. Designed to be hit once after a test
// call to see where the pipeline is failing.
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(_req, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (
    !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')
    && !hasPermission(access.role, 'VIEW_OWN_RECORDINGS')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const teamView = canViewTeamCalls(access);
  const ownCallScope = ownCallsOrFilter(null, user.id);
  const eligibleDurationFilter = PLAYABLE_RECORDING_DURATION_FILTER;
  const twilioVoiceConfigured = isVoiceServiceConfigured();
  const webhookSignatureConfigured = readVoiceWebhookSignatureReady();

  // 1. Internal pipeline configuration (generic keys only — never vendor names)
  const appBaseUrl = resolveAppBaseUrl();
  const voiceEnv = snapshotVoiceEnv();
  const env = {
    voice_provider: voiceEnv.configured,
    voice_connection: Boolean(voiceEnv.connectionId),
    voice_call_control: Boolean(voiceEnv.callControlAppId),
    webhook_signature: webhookSignatureConfigured,
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
  let totalCallsQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true });
  totalCallsQuery = teamView
    ? totalCallsQuery.eq('user_id', user.id)
    : totalCallsQuery.or(ownCallScope);
  const { count: totalCalls } = await totalCallsQuery;

  let capturedEligibleQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter);
  capturedEligibleQuery = teamView
    ? capturedEligibleQuery.eq('user_id', user.id)
    : capturedEligibleQuery.or(ownCallScope);
  const { count: capturedEligible } = await capturedEligibleQuery;

  let playableQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .not('recording_supabase_path', 'is', null)
    .or(eligibleDurationFilter);
  playableQuery = teamView
    ? playableQuery.eq('user_id', user.id)
    : playableQuery.or(ownCallScope);
  const { count: playableRecordings } = await playableQuery;

  let longEnoughQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .or(eligibleDurationFilter);
  longEnoughQuery = teamView
    ? longEnoughQuery.eq('user_id', user.id)
    : longEnoughQuery.or(ownCallScope);
  const { count: longEnough } = await longEnoughQuery;

  let recordedFlagQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('was_recorded', true);
  recordedFlagQuery = teamView
    ? recordedFlagQuery.eq('user_id', user.id)
    : recordedFlagQuery.or(ownCallScope);
  const { count: recordedFlag } = await recordedFlagQuery;

  let aiCompletedQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .not('recording_supabase_path', 'is', null)
    .or(eligibleDurationFilter)
    .eq('ai_processed', true);
  aiCompletedQuery = teamView
    ? aiCompletedQuery.eq('user_id', user.id)
    : aiCompletedQuery.or(ownCallScope);
  const { count: aiCompleted } = await aiCompletedQuery;

  let aiPendingQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter)
    .in('ai_processing_status', ['pending', 'processing']);
  aiPendingQuery = teamView
    ? aiPendingQuery.eq('user_id', user.id)
    : aiPendingQuery.or(ownCallScope);
  const { count: aiPending } = await aiPendingQuery;

  let aiFailedQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter)
    .eq('ai_processing_status', 'failed');
  aiFailedQuery = teamView
    ? aiFailedQuery.eq('user_id', user.id)
    : aiFailedQuery.or(ownCallScope);
  const { count: aiFailed } = await aiFailedQuery;

  let mirroredToStorageQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter)
    .not('recording_supabase_path', 'is', null);
  mirroredToStorageQuery = teamView
    ? mirroredToStorageQuery.eq('user_id', user.id)
    : mirroredToStorageQuery.or(ownCallScope);
  const { count: mirroredToStorage } = await mirroredToStorageQuery;

  let needsMirrorQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter)
    .is('recording_supabase_path', null);
  needsMirrorQuery = teamView
    ? needsMirrorQuery.eq('user_id', user.id)
    : needsMirrorQuery.or(ownCallScope);
  const { count: needsMirror } = await needsMirrorQuery;

  const staleBefore = new Date(Date.now() - AI_PROCESSING_STALE_MS).toISOString();
  let aiStuckQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(eligibleDurationFilter)
    .eq('ai_processing_status', 'processing')
    .lt('ai_processed_at', staleBefore);
  aiStuckQuery = teamView
    ? aiStuckQuery.eq('user_id', user.id)
    : aiStuckQuery.or(ownCallScope);
  const { count: aiStuck } = await aiStuckQuery;

  // 4. Most recent 5 calls — show what state they are in
  let recentQuery = supabase
    .from('calls')
    .select(
      'id, created_at, status, duration_seconds, was_recorded, recording_url, recording_supabase_path, ai_processing_status, ai_error, hangup_cause',
    );
  recentQuery = teamView
    ? recentQuery.eq('user_id', user.id)
    : recentQuery.or(ownCallScope);
  const { data: recent } = await recentQuery
    .order('created_at', { ascending: false })
    .limit(5);

  // 5. Generate a human-readable diagnosis
  const issues: string[] = [];

  if (!env.voice_provider) issues.push('Voice provider is not configured — recordings cannot be started.');
  if (!env.webhook_signature) {
    issues.push(
      'Webhook signing key is not configured — production voice webhooks may be rejected.',
    );
  }
  if (!env.app_url) {
    issues.push('Application URL is not configured — add the public app URL in deployment settings so processing callbacks can run.');
  }
  if (!env.database_service)
    issues.push('Database service is not configured — webhooks cannot persist call data.');
  if (!env.transcription) issues.push('Transcription service is not configured.');
  if (!env.call_analysis) issues.push('Call analysis service is not configured — summaries may be limited.');

  if (settings?.recording_mode === 'never') {
    issues.push("Settings → Recording → Recording mode is 'never'. Set it to 'always' to record.");
  }

  if (longEnough === 0 && totalCalls && totalCalls > 0) {
    issues.push(
      `None of your ${totalCalls} calls reached ${MIN_PLAYABLE_RECORDING_SECONDS} seconds. Short calls are intentionally excluded from the recording library and AI queue.`,
    );
  }

  if (totalCalls && totalCalls > 0 && (longEnough ?? 0) > 0) {
    if (recordedFlag === 0 || capturedEligible === 0) {
      issues.push(
        'Eligible calls exist, but no call recording audio has been captured yet. Check recording mode and voice webhook configuration.',
      );
    } else if (playableRecordings === 0 && (needsMirror ?? 0) === 0) {
      issues.push(
        'Call recordings were captured but are not playable yet. Check saved-audio storage configuration.',
      );
    }
  }

  if ((capturedEligible ?? 0) > 0 && (aiCompleted ?? 0) === 0 && (aiPending ?? 0) === 0) {
    issues.push(
      'Recordings exist but none completed AI analysis. Retry the AI queue or check AI service keys.',
    );
  }

  if ((aiStuck ?? 0) > 0) {
    issues.push(
      `${aiStuck} eligible recording(s) stuck in processing >12 min — cron or POST /api/recordings/backfill-ai will retry.`,
    );
  }

  if ((aiFailed ?? 0) > 0) {
    issues.push(`${aiFailed} recording(s) failed AI — open Recent calls for ai_error, then reprocess from Recordings.`);
  }

  if ((capturedEligible ?? 0) > 0 && (needsMirror ?? 0) > 0) {
    issues.push(
      `${needsMirror} eligible recording(s) not yet saved for secure playback — POST /api/recordings/backfill-storage or wait for cron.`,
    );
  }

  return NextResponse.json({
    ok: issues.length === 0,
    summary: {
      total_calls: totalCalls ?? 0,
      calls_with_recording_url: playableRecordings ?? 0,
      eligible_recordings_captured: capturedEligible ?? 0,
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
        ? `Pipeline looks healthy. Make a test call over ${MIN_PLAYABLE_RECORDING_SECONDS} seconds and refresh /recordings within 60s.`
        : 'Fix the issues above. Most common: voice webhook URL not configured.',
  });
}
