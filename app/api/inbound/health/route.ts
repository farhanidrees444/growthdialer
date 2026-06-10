import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { resolveAppBaseUrl } from '@/lib/ai/trigger-process-call';
import { getNumberConnectionId } from '@/lib/voice/assign-number-connection';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim() ?? null;

  const [settingsRes, numbersRes, recentInboundRes] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, status, telnyx_number_id, is_default')
      .eq('user_id', user.id)
      .neq('status', 'released')
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
  const numbers = numbersRes.data ?? [];
  const appUrl = resolveAppBaseUrl();

  let routedCount = 0;
  let unroutedCount = 0;

  if (connectionId) {
    await Promise.all(
      numbers.map(async (n) => {
        const tid = n.telnyx_number_id as string | null;
        if (!tid) {
          unroutedCount++;
          return;
        }
        const onConnection = await getNumberConnectionId(tid);
        if (onConnection === connectionId) routedCount++;
        else unroutedCount++;
      }),
    );
  } else {
    unroutedCount = numbers.length;
  }

  const checks = [
    {
      id: 'voice_service',
      label: 'Voice service',
      ok: Boolean(process.env.TELNYX_API_KEY && connectionId),
      hint: 'Voice service credentials are not fully configured.',
    },
    {
      id: 'event_verification',
      label: 'Call event verification',
      ok: Boolean(process.env.TELNYX_PUBLIC_KEY),
      hint: 'Call event verification is not configured — inbound calls may not register.',
    },
    {
      id: 'app_url',
      label: 'Server callbacks',
      ok: Boolean(appUrl),
      hint: 'Application URL is not configured for call events.',
    },
    {
      id: 'numbers',
      label: 'Phone numbers',
      ok: numbers.length > 0,
      hint: 'Buy or sync a number to receive inbound calls.',
    },
    {
      id: 'number_routing',
      label: 'Inbound number routing',
      ok: numbers.length > 0 && unroutedCount === 0,
      hint:
        unroutedCount > 0
          ? `${unroutedCount} number(s) are not linked to your voice line — tap Activate inbound below.`
          : 'No numbers assigned for inbound.',
    },
    {
      id: 'mode',
      label: 'Call routing mode',
      ok: mode !== 'off',
      hint: 'Inbound is set to reject all calls — change in Routing settings.',
    },
    {
      id: 'browser_mode',
      label: 'Browser answering',
      ok: mode === 'browser' || mode === 'forward',
      hint: mode === 'voicemail' ? 'Voicemail only — browser will not ring.' : undefined,
    },
  ];

  const score = checks.filter((c) => c.ok).length;
  const eventOk = checks.find((c) => c.id === 'event_verification')?.ok ?? false;
  const routingOk = checks.find((c) => c.id === 'number_routing')?.ok ?? false;
  const ready = eventOk && routingOk && numbers.length > 0 && mode !== 'off' && Boolean(appUrl);

  return NextResponse.json({
    ready,
    score,
    total: checks.length,
    checks,
    inbound_mode: mode,
    number_count: numbers.length,
    routed_count: routedCount,
    unrouted_count: unroutedCount,
    needs_activation: unroutedCount > 0,
    primary_number: numbers.find((n) => n.is_default)?.phone_number ?? numbers[0]?.phone_number ?? null,
    last_inbound_at: recentInboundRes.data?.started_at ?? null,
  });
}
