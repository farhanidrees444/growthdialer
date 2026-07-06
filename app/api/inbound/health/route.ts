import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { getTelephonyProvider } from '@/lib/telephony';
import { readTelephonyPublicKey } from '@/lib/telephony/telnyx/env';
import { resolveActiveCredentialId } from '@/lib/telnyx/active-credential';
import { ensureVoiceConnectionConfigured } from '@/lib/voice/configure-connection';
import {
  isTelnyxInboundReady,
  listInboundBlockers,
  resolveInboundAppUrl,
} from '@/lib/voice/inbound-readiness';
import { readCallControlAppId } from '@/lib/voice/read-env';
import {
  auditNumberRouting,
  backfillProviderIds,
  fetchProviderPhoneIndex,
  type DbNumberRow,
} from '@/lib/voice/provider-numbers';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const provider = getTelephonyProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({
      status: 'needs_setup',
      ready: false,
      headline: 'Voice service is not configured',
      subline: 'Add voice API keys and connection settings to deployment settings, then redeploy.',
      action: null,
      inbound_mode: 'browser',
      number_count: 0,
      routed_count: 0,
      unrouted_count: 0,
      primary_routed: false,
      needs_activation: false,
      primary_number: null,
      last_inbound_at: null,
      blockers: [{
        code: 'voice_not_configured',
        label: 'Voice service is not configured',
        fix: 'Add TELNYX_API_KEY, TELNYX_CONNECTION_ID, and TELNYX_CALL_CONTROL_APP_ID in Vercel, then redeploy.',
      }],
      voice_provider: 'telnyx',
    });
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const appUrl = resolveInboundAppUrl(host);
  const eventsVerified = Boolean(readTelephonyPublicKey()?.trim());
  const callControlAppId = readCallControlAppId();

  const [connection, credentialId, settingsRes, numbersRes, recentInboundRes] = await Promise.all([
    ensureVoiceConnectionConfigured(),
    resolveActiveCredentialId(supabase, user.id),
    supabase
      .from('user_settings')
      .select('inbound_mode')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, status, is_default, telnyx_number_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_default', { ascending: false }),
    supabase
      .from('calls')
      .select('id, started_at')
      .eq('user_id', user.id)
      .eq('direction', 'inbound')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const mode = (settingsRes.data?.inbound_mode as string | null) ?? 'browser';
  const numbers = (numbersRes.data ?? []) as DbNumberRow[];
  const inboundEnabled = mode !== 'off';
  const browserAnswering = mode === 'browser' || mode === 'forward';
  const credentialReady = Boolean(credentialId);
  const hasRecentInbound = Boolean(recentInboundRes.data?.started_at);

  const providerIndex = await fetchProviderPhoneIndex();
  await backfillProviderIds(supabase, numbers, providerIndex);
  const routingAudit = await auditNumberRouting(numbers, callControlAppId, providerIndex);

  const blockers = listInboundBlockers({
    connection,
    eventsVerified,
    appUrl,
    primaryRouted: routingAudit.primary_routed,
    hasNumbers: numbers.length > 0,
    inboundEnabled,
    browserAnswering,
    credentialReady,
    providerReachable: connection.ok,
    hasRecentInbound,
    callControlReady: Boolean(callControlAppId),
  });

  let status: 'live' | 'almost_ready' | 'needs_setup' | 'offline' = 'needs_setup';
  let headline = 'Setting up your inbound line';
  let subline = 'Keep this page open — we auto-configure voice on load.';
  let action: { type: 'activate_routing'; label: string } | null = null;

  if (numbers.length === 0) {
    status = 'needs_setup';
    headline = 'No phone number assigned';
    subline = 'Purchase or assign a number in My Numbers to receive inbound calls.';
  } else if (!inboundEnabled) {
    status = 'offline';
    headline = 'Inbound is turned off';
    subline = 'Change routing to Ring in Browser on this page.';
  } else if (!browserAnswering) {
    status = 'almost_ready';
    headline = 'Voicemail mode is on';
    subline = 'Switch to browser ringing to answer live.';
  } else if (routingAudit.needs_activation) {
    status = 'almost_ready';
    headline = 'Linking your number to voice routing';
    subline = 'Refresh this page — we auto-link numbers on load. If this persists, open My Numbers.';
    action = { type: 'activate_routing', label: 'Link numbers for inbound' };
  } else if (!credentialReady) {
    status = 'almost_ready';
    headline = 'Browser voice endpoint is starting';
    subline = 'Allow microphone access and keep this tab open while we register your line.';
  } else if (blockers.length > 0) {
    status = 'almost_ready';
    headline = blockers[0]?.label ?? 'Your line is being finalized';
    subline = blockers[0]?.fix ?? 'Keep this page open — inbound will be fully live shortly.';
  } else {
    status = 'live';
    headline = 'Inbound line is live';
    subline = 'Ready to receive calls — keep this page open to answer in the browser.';
  }

  const ready = isTelnyxInboundReady({
    hasNumbers: numbers.length > 0,
    inboundEnabled,
    browserAnswering,
    primaryRouted: routingAudit.primary_routed,
    credentialReady,
    eventsVerified,
    appUrl,
    connectionOk: connection.ok,
    blockers,
  }) && status === 'live';

  return NextResponse.json({
    status,
    ready,
    headline,
    subline,
    action,
    inbound_mode: mode,
    number_count: numbers.length,
    routed_count: routingAudit.routed,
    unrouted_count: routingAudit.unrouted,
    primary_routed: routingAudit.primary_routed,
    needs_activation: routingAudit.needs_activation,
    primary_number:
      numbers.find((n) => n.is_default)?.phone_number
      ?? numbers[0]?.phone_number
      ?? null,
    last_inbound_at: recentInboundRes.data?.started_at ?? null,
    blockers,
    voice_provider: 'telnyx',
  });
}
