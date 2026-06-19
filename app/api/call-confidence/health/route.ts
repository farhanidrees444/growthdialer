import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { canViewTeamCalls, ownCallsOrFilter } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { isTwilioVoiceConfigured, readTwilioAuthToken } from '@/lib/twilio/voice-config';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { resolveInboundAppUrl } from '@/lib/voice/inbound-readiness';
import { AI_PROCESSING_STALE_MS } from '@/lib/ai/pipeline-status';
import { PLAYABLE_RECORDING_DURATION_FILTER } from '@/lib/recordings/eligibility';

export const dynamic = 'force-dynamic';

type ConfidenceStatus = 'healthy' | 'warning' | 'blocked' | 'unknown';

interface ConfidenceCheck {
  id: string;
  label: string;
  status: ConfidenceStatus;
  detail: string;
  action: string;
}

function overallFrom(checks: ConfidenceCheck[]): ConfidenceStatus {
  if (checks.some((check) => check.status === 'blocked')) return 'blocked';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  if (checks.some((check) => check.status === 'unknown')) return 'unknown';
  return 'healthy';
}

function compactError(message: string | null | undefined): string | null {
  if (!message?.trim()) return null;
  return message.trim().replace(/\s+/g, ' ').slice(0, 180);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (
    !hasPermission(access.role, 'MAKE_CALLS')
    && !hasPermission(access.role, 'VIEW_OWN_ANALYTICS')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const teamView = canViewTeamCalls(access);
  const workspaceId = access.workspaceId;
  const ownScope = ownCallsOrFilter(workspaceId, user.id);
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');

  const [
    settingsRes,
    numbersRes,
    lastInboundRes,
  ] = await Promise.all([
    supabase
      .from('user_settings')
      .select('recording_mode, ai_auto_transcribe, ai_auto_summarize, inbound_mode')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, is_default, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_default', { ascending: false }),
    supabase
      .from('inbound_calls')
      .select('id, status, started_at, answered_at, ended_at, duration_seconds, to_number')
      .eq('routed_agent_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const settings = settingsRes.data;
  const numbers = numbersRes.data ?? [];
  const inboundMode = (settings?.inbound_mode as string | null) ?? 'browser';
  const inboundEnabled = inboundMode !== 'off';
  const browserAnswering = inboundMode === 'browser' || inboundMode === 'forward';
  const appUrl = resolveInboundAppUrl(host);
  const voiceConfigured = isTwilioVoiceConfigured();
  const webhookUrl = resolveVoiceWebhookUrl();
  const webhookSignatureReady = Boolean(readTwilioAuthToken());
  const recordingMode = (settings?.recording_mode as string | null) ?? 'always';
  const aiFeaturesEnabled = settings?.ai_auto_transcribe !== false || settings?.ai_auto_summarize !== false;
  const aiKeysReady = Boolean(process.env.GROQ_API_KEY?.trim() && process.env.GEMINI_API_KEY?.trim());
  const internalPipelineReady = Boolean(process.env.INTERNAL_API_SECRET?.trim());
  const storageReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  let totalCallsQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true });
  totalCallsQuery = teamView
    ? totalCallsQuery.eq('workspace_id', workspaceId)
    : totalCallsQuery.or(ownScope);
  const { count: totalCalls } = await totalCallsQuery;

  let latestCallQuery = supabase
    .from('calls')
    .select(
      'id, created_at, status, direction, duration_seconds, recording_url, recording_supabase_path, was_recorded, ai_processing_status, ai_error, hangup_cause',
    );
  latestCallQuery = teamView
    ? latestCallQuery.eq('workspace_id', workspaceId)
    : latestCallQuery.or(ownScope);
  const { data: latestCall } = await latestCallQuery
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let capturedEligibleQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER);
  capturedEligibleQuery = teamView
    ? capturedEligibleQuery.eq('workspace_id', workspaceId)
    : capturedEligibleQuery.or(ownScope);
  const { count: capturedEligible } = await capturedEligibleQuery;

  let playableQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .not('recording_supabase_path', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER);
  playableQuery = teamView
    ? playableQuery.eq('workspace_id', workspaceId)
    : playableQuery.or(ownScope);
  const { count: playableRecordings } = await playableQuery;

  let needsMirrorQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .is('recording_supabase_path', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER);
  needsMirrorQuery = teamView
    ? needsMirrorQuery.eq('workspace_id', workspaceId)
    : needsMirrorQuery.or(ownScope);
  const { count: needsMirror } = await needsMirrorQuery;

  let aiPendingQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER)
    .in('ai_processing_status', ['pending', 'processing']);
  aiPendingQuery = teamView
    ? aiPendingQuery.eq('workspace_id', workspaceId)
    : aiPendingQuery.or(ownScope);
  const { count: aiPending } = await aiPendingQuery;

  let aiFailedQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER)
    .eq('ai_processing_status', 'failed');
  aiFailedQuery = teamView
    ? aiFailedQuery.eq('workspace_id', workspaceId)
    : aiFailedQuery.or(ownScope);
  const { count: aiFailed } = await aiFailedQuery;

  const staleBefore = new Date(Date.now() - AI_PROCESSING_STALE_MS).toISOString();
  let aiStuckQuery = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .not('recording_url', 'is', null)
    .or(PLAYABLE_RECORDING_DURATION_FILTER)
    .eq('ai_processing_status', 'processing')
    .lt('ai_processed_at', staleBefore);
  aiStuckQuery = teamView
    ? aiStuckQuery.eq('workspace_id', workspaceId)
    : aiStuckQuery.or(ownScope);
  const { count: aiStuck } = await aiStuckQuery;

  const checks: ConfidenceCheck[] = [];

  checks.push({
    id: 'voice_service',
    label: 'Voice service config',
    status: voiceConfigured && webhookUrl ? 'healthy' : 'blocked',
    detail: voiceConfigured && webhookUrl
      ? 'Server credentials and public call webhook URL are present.'
      : 'The server is missing voice credentials or the public app URL.',
    action: voiceConfigured && webhookUrl
      ? 'Make a short browser test call, then refresh this panel.'
      : 'Add voice credentials and APP_URL in deployment settings, then redeploy.',
  });

  checks.push({
    id: 'inbound_webhook',
    label: 'Inbound webhook and routing',
    status: numbers.length === 0
      ? 'blocked'
      : !inboundEnabled
        ? 'warning'
        : browserAnswering && webhookSignatureReady && appUrl
          ? 'healthy'
          : 'warning',
    detail: numbers.length === 0
      ? 'No active phone number is available for inbound routing.'
      : !inboundEnabled
        ? 'Inbound routing is currently turned off.'
        : browserAnswering && webhookSignatureReady && appUrl
          ? `Inbound is routed to browser answering on ${numbers[0]?.phone_number ?? 'your primary line'}.`
          : 'Inbound routing exists, but event verification or browser answering needs attention.',
    action: numbers.length === 0
      ? 'Buy or sync a number from My Numbers.'
      : !inboundEnabled
        ? 'Open Settings -> Inbound and switch routing back on.'
        : browserAnswering && webhookSignatureReady && appUrl
          ? 'Keep the app open when expecting inbound calls.'
          : 'Check Settings -> Inbound and confirm deployment webhook settings.',
  });

  checks.push({
    id: 'last_inbound',
    label: 'Last inbound route',
    status: lastInboundRes.data ? 'healthy' : 'unknown',
    detail: lastInboundRes.data
      ? `Last routed inbound call is ${lastInboundRes.data.status}.`
      : 'No routed inbound call has been recorded for this agent yet.',
    action: lastInboundRes.data
      ? 'Open Incoming or Call Logs to inspect the route.'
      : 'Place a test inbound call to confirm routing end to end.',
  });

  checks.push({
    id: 'recordings',
    label: 'Recording capture and storage',
    status: recordingMode === 'never'
      ? 'blocked'
      : !storageReady || (needsMirror ?? 0) > 0
        ? 'warning'
        : (capturedEligible ?? 0) === 0 && (totalCalls ?? 0) > 0
          ? 'warning'
          : 'healthy',
    detail: recordingMode === 'never'
      ? 'Recording is disabled in settings.'
      : `${playableRecordings ?? 0} playable recording(s), ${needsMirror ?? 0} waiting for secure playback.`,
    action: recordingMode === 'never'
      ? 'Open Settings -> Recording and choose an automatic or manual recording mode.'
      : !storageReady
        ? 'Add database service credentials so saved audio can be secured.'
        : (needsMirror ?? 0) > 0
          ? 'Open Recordings and run the secure saved audio action.'
          : 'Make a call over 30 seconds to keep verifying the pipeline.',
  });

  checks.push({
    id: 'ai_analysis',
    label: 'AI analysis pipeline',
    status: !aiFeaturesEnabled
      ? 'warning'
      : !aiKeysReady || !internalPipelineReady
        ? 'blocked'
        : (aiFailed ?? 0) > 0 || (aiStuck ?? 0) > 0
          ? 'warning'
          : 'healthy',
    detail: !aiFeaturesEnabled
      ? 'AI processing is partially disabled in settings.'
      : `${aiPending ?? 0} pending, ${aiFailed ?? 0} failed, ${aiStuck ?? 0} stuck analysis job(s).`,
    action: !aiFeaturesEnabled
      ? 'Open Settings -> AI and enable the analysis features you want.'
      : !aiKeysReady || !internalPipelineReady
        ? 'Add AI service keys and the internal pipeline secret in deployment settings.'
        : (aiFailed ?? 0) > 0 || (aiStuck ?? 0) > 0
          ? 'Open Recordings and retry the AI queue.'
          : 'Review the newest analyzed recording after the next eligible call.',
  });

  const latestAiError = compactError(latestCall?.ai_error as string | null | undefined);

  return NextResponse.json({
    overall: overallFrom(checks),
    checked_at: new Date().toISOString(),
    checks,
    summary: {
      active_numbers: numbers.length,
      total_calls: totalCalls ?? 0,
      eligible_recordings_captured: capturedEligible ?? 0,
      playable_recordings: playableRecordings ?? 0,
      pending_storage_mirror: needsMirror ?? 0,
      ai_pending_or_processing: aiPending ?? 0,
      ai_failed: aiFailed ?? 0,
      ai_stuck_processing: aiStuck ?? 0,
    },
    last_inbound_call: lastInboundRes.data
      ? {
          id: lastInboundRes.data.id,
          status: lastInboundRes.data.status,
          started_at: lastInboundRes.data.started_at,
          answered_at: lastInboundRes.data.answered_at,
          ended_at: lastInboundRes.data.ended_at,
          duration_seconds: lastInboundRes.data.duration_seconds,
          to_number: lastInboundRes.data.to_number,
        }
      : null,
    last_call: latestCall
      ? {
          id: latestCall.id,
          status: latestCall.status,
          direction: latestCall.direction,
          created_at: latestCall.created_at,
          duration_seconds: latestCall.duration_seconds,
          was_recorded: Boolean(latestCall.was_recorded || latestCall.recording_url),
          has_playable_recording: Boolean(latestCall.recording_supabase_path),
          ai_processing_status: latestCall.ai_processing_status,
          ai_error: latestAiError,
          hangup_cause: latestCall.hangup_cause,
        }
      : null,
    next_action:
      checks.find((check) => check.status === 'blocked')?.action
      ?? checks.find((check) => check.status === 'warning')?.action
      ?? 'Pipeline looks ready. Run a real test call and refresh this panel.',
  });
}
