import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import {
  auditNumberRouting,
  backfillProviderIds,
  fetchProviderPhoneIndex,
} from '@/lib/voice/provider-numbers';
import {
  ensureVoiceConnectionConfigured,
  ensureCallControlAppConfigured,
  getActiveCallControlAppId,
  getActiveVoiceConnectionId,
} from '@/lib/voice/configure-connection';
import {
  listInboundBlockers,
  resolveInboundAppUrl,
} from '@/lib/voice/inbound-readiness';
import { resolveActiveCredentialId } from '@/lib/telnyx/active-credential';
import { resolveInboundBrowserCredential } from '@/lib/inbound/browser-credential';
import { readVoiceApiKey } from '@/lib/voice/read-env';
import {
  isTwilioInboundReady,
  listTwilioInboundBlockers,
} from '@/lib/twilio/twilio-readiness';
import { isTwilioVoiceConfigured, readTwilioNumber } from '@/lib/twilio/voice-config';
import { normalizeE164 } from '@/lib/inbound/phone';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const twilioMode = isTwilioVoiceConfigured();
  const twilioNumber = readTwilioNumber();

  const [settingsRes, numbersRes, recentInboundRes, providerIndex, connectionConfig, callControlConfig, inboundBrowserCred, sipConnectionId, callControlAppId] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, status, telnyx_number_id, is_default')
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
    twilioMode ? Promise.resolve(new Map()) : fetchProviderPhoneIndex(),
    ensureVoiceConnectionConfigured(),
    ensureCallControlAppConfigured(),
    twilioMode ? Promise.resolve(null) : resolveInboundBrowserCredential(supabase, user.id),
    getActiveVoiceConnectionId(),
    getActiveCallControlAppId(),
  ]);

  const credentialId = twilioMode
    ? 'twilio-client'
    : (inboundBrowserCred?.credentialId ?? await resolveActiveCredentialId(supabase, user.id));

  const mode = (settingsRes.data?.inbound_mode as string | null) ?? 'browser';
  const numbers = (numbersRes.data ?? []).map((n) => ({
    id: n.id as string,
    phone_number: n.phone_number as string,
    telnyx_number_id: n.telnyx_number_id as string | null,
    is_default: Boolean(n.is_default),
  }));

  if (!twilioMode) {
    await backfillProviderIds(supabase, numbers, providerIndex);
  }

  const numberRoutingId = callControlAppId ?? sipConnectionId;
  const routing = twilioMode
    ? {
        primary_routed: true,
        routed: numbers.length,
        unrouted: 0,
        total: numbers.length,
        needs_activation: false,
        unrouted_phones: [] as string[],
      }
    : await auditNumberRouting(numbers, numberRoutingId, providerIndex);

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const appUrl = resolveInboundAppUrl(host);
  const eventsVerified = twilioMode
    ? Boolean(process.env.TWILIO_AUTH_TOKEN?.trim())
    : Boolean(process.env.TELNYX_PUBLIC_KEY?.trim());
  const voiceApiPresent = Boolean(readVoiceApiKey());
  const providerReachable = twilioMode || providerIndex.size > 0;
  const hasRecentInbound = Boolean(recentInboundRes.data);
  const credentialReady = twilioMode || Boolean(inboundBrowserCred?.token && inboundBrowserCred?.sipUsername);
  const voiceOperational =
    (connectionConfig.ok && callControlConfig.ok)
    || (providerReachable && voiceApiPresent && Boolean(sipConnectionId) && credentialReady)
    || (hasRecentInbound && credentialReady && voiceApiPresent);
  const voiceConfigured = voiceOperational && voiceApiPresent;
  const inboundEnabled = mode !== 'off';
  const browserAnswering = mode === 'browser' || mode === 'forward';

  const twilioNumberLinked = twilioNumber
    ? numbers.some((n) => normalizeE164(n.phone_number) === twilioNumber)
    : undefined;

  const blockers = twilioMode
    ? listTwilioInboundBlockers({
        hasNumbers: numbers.length > 0,
        inboundEnabled,
        browserAnswering,
        appUrl,
        twilioNumberLinked: numbers.length === 0 ? undefined : twilioNumberLinked,
      })
    : listInboundBlockers({
        connection: connectionConfig,
        eventsVerified,
        appUrl,
        primaryRouted: routing.primary_routed,
        hasNumbers: numbers.length > 0,
        inboundEnabled,
        browserAnswering,
        credentialReady,
        providerReachable,
        hasRecentInbound,
        credentialEnvSwap: false,
        callControlReady: callControlConfig.ok,
      });

  let status: 'live' | 'almost_ready' | 'needs_setup' | 'offline' = 'needs_setup';
  let headline = 'Setting up your inbound line';
  let subline = 'Add a phone number to start receiving calls.';
  let action: { type: 'activate_routing'; label: string } | null = null;

  if (numbers.length === 0) {
    status = 'needs_setup';
  } else if (!inboundEnabled) {
    status = 'offline';
    headline = 'Inbound is turned off';
    subline = 'Change routing to accept calls again.';
  } else if (!twilioMode && routing.needs_activation) {
    status = 'almost_ready';
    headline = 'One step left — link your numbers';
    subline =
      routing.unrouted === 1
        ? 'Your line is almost ready. Link your number to start receiving calls in the browser.'
        : `${routing.unrouted} numbers need to be linked to your voice line.`;
    action = { type: 'activate_routing', label: 'Link numbers for inbound' };
  } else if (!browserAnswering) {
    status = 'almost_ready';
    headline = 'Voicemail mode is on';
    subline = 'Calls go straight to voicemail — switch to browser ringing to answer live.';
  } else if (!voiceConfigured || !eventsVerified || !appUrl || blockers.length > 0) {
    status = 'almost_ready';
    headline = blockers[0]?.label ?? 'Your line is being finalized';
    subline = blockers[0]?.fix ?? 'Keep this page open — inbound will be fully live shortly.';
  } else {
    status = 'live';
    headline = 'Inbound line is live';
    subline = 'Ready to receive calls — keep this page open to answer in the browser.';
  }

  const twilioReady = twilioMode && isTwilioInboundReady({
    hasNumbers: numbers.length > 0,
    inboundEnabled,
    browserAnswering,
    appUrl,
    twilioNumberLinked: numbers.length === 0 ? undefined : twilioNumberLinked,
  });

  const ready =
    status === 'live'
    && routing.primary_routed
    && inboundEnabled
    && browserAnswering
    && eventsVerified
    && voiceConfigured
    && Boolean(appUrl)
    && Boolean(credentialId)
    && blockers.length === 0
    && (twilioMode ? twilioReady : true);

  return NextResponse.json({
    status,
    ready,
    headline,
    subline,
    action,
    inbound_mode: mode,
    number_count: numbers.length,
    routed_count: routing.routed,
    unrouted_count: routing.unrouted,
    primary_routed: routing.primary_routed,
    needs_activation: twilioMode ? false : routing.needs_activation,
    primary_number: twilioNumber
      ?? numbers.find((n) => n.is_default)?.phone_number
      ?? numbers[0]?.phone_number
      ?? null,
    last_inbound_at: recentInboundRes.data?.started_at ?? null,
    blockers,
    voice_provider: twilioMode ? 'twilio' : 'legacy',
  });
}
