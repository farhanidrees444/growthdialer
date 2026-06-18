import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import {
  isTwilioInboundReady,
  listTwilioInboundBlockers,
} from '@/lib/twilio/twilio-readiness';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import { resolveInboundAppUrl } from '@/lib/voice/inbound-readiness';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isTwilioVoiceConfigured()) {
    return NextResponse.json({
      status: 'needs_setup',
      ready: false,
      headline: 'Voice service is not configured',
      subline: 'Add voice credentials to deployment settings and redeploy.',
      action: null,
      inbound_mode: 'browser',
      number_count: 0,
      routed_count: 0,
      unrouted_count: 0,
      primary_routed: false,
      needs_activation: false,
      primary_number: null,
      last_inbound_at: null,
      blockers: [],
      voice_provider: 'twilio',
    });
  }

  const [settingsRes, numbersRes, recentInboundRes] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, status, is_default')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_default', { ascending: false }),
    supabase
      .from('inbound_calls')
      .select('id, started_at')
      .eq('routed_agent_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const mode = (settingsRes.data?.inbound_mode as string | null) ?? 'browser';
  const numbers = numbersRes.data ?? [];
  const inboundEnabled = mode !== 'off';
  const browserAnswering = mode === 'browser' || mode === 'forward';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const appUrl = resolveInboundAppUrl(host);
  const eventsVerified = Boolean(process.env.TWILIO_AUTH_TOKEN?.trim());

  const blockers = listTwilioInboundBlockers({
    hasNumbers: numbers.length > 0,
    inboundEnabled,
    browserAnswering,
    appUrl,
  });

  let status: 'live' | 'almost_ready' | 'needs_setup' | 'offline' = 'needs_setup';
  let headline = 'Setting up your inbound line';
  let subline = 'Contact support to assign a voice line to your account.';
  const action = null;

  if (numbers.length === 0) {
    status = 'needs_setup';
  } else if (!inboundEnabled) {
    status = 'offline';
    headline = 'Inbound is turned off';
    subline = 'Change routing to accept calls again.';
  } else if (!browserAnswering) {
    status = 'almost_ready';
    headline = 'Voicemail mode is on';
    subline = 'Switch to browser ringing to answer live.';
  } else if (!eventsVerified || !appUrl || blockers.length > 0) {
    status = 'almost_ready';
    headline = blockers[0]?.label ?? 'Your line is being finalized';
    subline = blockers[0]?.fix ?? 'Keep this page open — inbound will be fully live shortly.';
  } else {
    status = 'live';
    headline = 'Inbound line is live';
    subline = 'Ready to receive calls — keep this page open to answer in the browser.';
  }

  const twilioReady = isTwilioInboundReady({
    hasNumbers: numbers.length > 0,
    inboundEnabled,
    browserAnswering,
    appUrl,
  });

  const ready =
    status === 'live'
    && inboundEnabled
    && browserAnswering
    && eventsVerified
    && Boolean(appUrl)
    && blockers.length === 0
    && twilioReady;

  return NextResponse.json({
    status,
    ready,
    headline,
    subline,
    action,
    inbound_mode: mode,
    number_count: numbers.length,
    routed_count: numbers.length,
    unrouted_count: 0,
    primary_routed: numbers.length > 0,
    needs_activation: false,
    primary_number:
      numbers.find((n) => n.is_default)?.phone_number
      ?? numbers[0]?.phone_number
      ?? null,
    last_inbound_at: recentInboundRes.data?.started_at ?? null,
    blockers,
    voice_provider: 'twilio',
  });
}
