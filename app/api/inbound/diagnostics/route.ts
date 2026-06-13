import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { prepareInboundAccount } from '@/lib/inbound/prepare-account';
import {
  auditNumberRouting,
  fetchProviderPhoneIndex,
  lookupProviderPhone,
} from '@/lib/voice/provider-numbers';
import {
  ensureVoiceConnectionConfigured,
  ensureCallControlAppConfigured,
  getActiveCallControlAppId,
  getActiveVoiceConnectionId,
} from '@/lib/voice/configure-connection';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { listInboundBlockers } from '@/lib/voice/inbound-readiness';
import { resolveActiveCredentialId, fetchCredentialSipUsername } from '@/lib/telnyx/active-credential';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';

/** Owner-facing inbound diagnostics (no vendor names in response). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (access.role !== 'owner' && access.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [connection, sipConnectionId, callControlAppId, callControlConfig] = await Promise.all([
    ensureVoiceConnectionConfigured(),
    getActiveVoiceConnectionId(),
    getActiveCallControlAppId(),
    ensureCallControlAppConfigured(),
  ]);
  const webhookUrl = resolveVoiceWebhookUrl();
  const eventsVerified = Boolean(process.env.TELNYX_PUBLIC_KEY?.trim());

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, is_default, status')
    .eq('user_id', user.id)
    .neq('status', 'released');

  const providerIndex = await fetchProviderPhoneIndex();
  const dbNumbers = (numbers ?? []).map((n) => ({
    id: n.id as string,
    phone_number: n.phone_number as string,
    telnyx_number_id: n.telnyx_number_id as string | null,
    is_default: Boolean(n.is_default),
  }));

  const numberRoutingId = callControlAppId ?? sipConnectionId;
  const routing = await auditNumberRouting(
    dbNumbers,
    numberRoutingId,
    providerIndex,
  );

  const inboundBrowserCred = await resolveInboundBrowserCredential(supabase, user.id);
  const credentialId = inboundBrowserCred?.credentialId ?? await resolveActiveCredentialId(supabase, user.id);
  const sipUsername = inboundBrowserCred?.sipUsername
    ?? (credentialId ? await fetchCredentialSipUsername(credentialId) : null);
  const { count: recentInbound } = await supabase
    .from('calls')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('direction', 'inbound')
    .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { data: lastInboundCalls } = await supabase
    .from('calls')
    .select('id, from_number, to_number, status, started_at, ended_at, telnyx_webrtc_leg_id, answered_at')
    .eq('user_id', user.id)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(3);

  const blockers = listInboundBlockers({
    connection,
    eventsVerified,
    appUrl: resolveVoiceWebhookUrl().replace(/\/api\/telnyx\/webhook$/, ''),
    primaryRouted: routing.primary_routed,
    hasNumbers: dbNumbers.length > 0,
    inboundEnabled: true,
    browserAnswering: true,
    credentialReady: Boolean(credentialId),
    callControlReady: callControlConfig.ok,
  });

  return NextResponse.json({
    line_ready:
      connection.ok
      && callControlConfig.ok
      && routing.primary_routed
      && eventsVerified
      && Boolean(credentialId)
      && Boolean(webhookUrl)
      && blockers.length === 0,
    connection_configured: connection.ok,
    connection_resolved: Boolean(sipConnectionId),
    connection_env_mismatch: connection.env_mismatch ?? false,
    connection_resolved_from: connection.resolved_from ?? null,
    event_verification: eventsVerified,
    browser_credential: Boolean(credentialId),
    credential_env_swap_detected: false,
    discovered_credential: Boolean(inboundBrowserCred?.credentialId),
    sip_endpoint_ready: Boolean(sipUsername),
    resolved_connection_id: sipConnectionId,
    call_control_app_id: callControlAppId,
    call_control_app_configured: callControlConfig.ok,
    number_routing_target: numberRoutingId,
    primary_routed: routing.primary_routed,
    numbers_total: routing.total,
    numbers_routed: routing.routed,
    unrouted_numbers: routing.unrouted_phones,
    inbound_calls_7d: recentInbound ?? 0,
    last_inbound_calls: (lastInboundCalls ?? []).map((c) => ({
      id: c.id,
      from: c.from_number,
      to: c.to_number,
      status: c.status,
      started_at: c.started_at,
      ended_at: c.ended_at,
      answered_at: c.answered_at,
      browser_leg: Boolean(c.telnyx_webrtc_leg_id),
    })),
    inbound_browser_credential_ready: Boolean(inboundBrowserCred),
    checks: [
      { label: 'SIP connection (browser login)', ok: connection.ok },
      { label: 'Programmable voice app', ok: callControlConfig.ok },
      { label: 'Call events', ok: eventsVerified },
      { label: 'Primary number routing', ok: routing.primary_routed },
      { label: 'Browser voice endpoint', ok: Boolean(sipUsername) },
    ],
    blockers,
    webhook_url: webhookUrl || null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await prepareInboundAccount(supabase, user.id, user.email ?? '');
  return NextResponse.json(result);
}
