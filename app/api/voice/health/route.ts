import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { resolvePerUserCredentialId, fetchCredentialToken } from '@/lib/telnyx/active-credential';
import {
  ensureVoiceConnectionConfigured,
  ensureCallControlAppConfigured,
  getActiveCallControlAppId,
  getActiveVoiceConnectionId,
} from '@/lib/voice/configure-connection';
import { readConfiguredConnectionId, readCallControlAppId, readVoiceApiKey } from '@/lib/voice/read-env';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';

/** GET /api/voice/health — voice stack readiness for the logged-in agent. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const blockers: string[] = [];

  const sipConnectionId = readConfiguredConnectionId();
  const callControlAppId = readCallControlAppId();
  const apiKey = readVoiceApiKey();
  const webhookUrl = resolveVoiceWebhookUrl();

  if (!apiKey) blockers.push('TELNYX_API_KEY missing');
  if (!sipConnectionId) blockers.push('TELNYX_CONNECTION_ID missing (SIP / WebRTC)');
  if (!callControlAppId) blockers.push('TELNYX_CALL_CONTROL_APP_ID missing (programmable voice)');
  if (!webhookUrl) blockers.push('APP_URL missing');

  const [sipConfig, callControlConfig, credentialId] = await Promise.all([
    ensureVoiceConnectionConfigured(),
    ensureCallControlAppConfigured(),
    resolvePerUserCredentialId(supabase, user.id),
  ]);

  if (!sipConfig.ok) blockers.push('SIP connection not ready');
  if (!callControlConfig.ok) blockers.push('Programmable voice app not ready');

  let tokenOk = false;
  if (credentialId) {
    const token = await fetchCredentialToken(credentialId, { fresh: true, bypassNegativeCache: true });
    tokenOk = Boolean(token);
    if (!tokenOk) blockers.push('Browser JWT token issuance failed');
  } else {
    blockers.push('No per-user telephony credential');
  }

  const { count: numberCount } = await supabase
    .from('purchased_numbers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (!numberCount) blockers.push('No active phone numbers assigned');

  const phoneReady = blockers.length === 0;

  return NextResponse.json({
    phone_ready: phoneReady,
    outbound_ready: phoneReady,
    inbound_ready: phoneReady && Boolean(callControlAppId),
    token_ok: tokenOk,
    sip_connection_id: sipConnectionId ?? (await getActiveVoiceConnectionId()),
    call_control_app_id: callControlAppId ?? (await getActiveCallControlAppId()),
    credential_id: credentialId,
    webhook_url: webhookUrl,
    active_numbers: numberCount ?? 0,
    blockers,
  });
}
