import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { resolveAppBaseUrl } from '@/lib/ai/trigger-process-call';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [settingsRes, numbersRes, recentInboundRes] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode, telnyx_telephony_credential_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, status')
      .eq('user_id', user.id)
      .neq('status', 'released')
      .limit(5),
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

  const checks = [
    {
      id: 'voice_api',
      label: 'Voice API configured',
      ok: Boolean(process.env.TELNYX_API_KEY),
      hint: 'Set TELNYX_API_KEY in Vercel',
    },
    {
      id: 'connection',
      label: 'Voice connection',
      ok: Boolean(process.env.TELNYX_CONNECTION_ID),
      hint: 'Set TELNYX_CONNECTION_ID in Vercel',
    },
    {
      id: 'webhook_key',
      label: 'Webhook signature key',
      ok: Boolean(process.env.TELNYX_PUBLIC_KEY),
      hint: 'Set TELNYX_PUBLIC_KEY or webhooks may be rejected',
    },
    {
      id: 'app_url',
      label: 'App URL for callbacks',
      ok: Boolean(appUrl),
      hint: 'Set APP_URL=https://app.growthdialer.com',
    },
    {
      id: 'numbers',
      label: 'Inbound number assigned',
      ok: numbers.length > 0,
      hint: 'Buy or sync a number on My Numbers',
    },
    {
      id: 'mode',
      label: 'Routing accepts calls',
      ok: mode !== 'off',
      hint: 'Change inbound mode from Reject All in settings',
    },
    {
      id: 'browser_mode',
      label: 'Browser ring enabled',
      ok: mode === 'browser' || mode === 'forward',
      hint: mode === 'voicemail' ? 'Voicemail only — browser will not ring' : undefined,
    },
  ];

  const score = checks.filter((c) => c.ok).length;
  const ready = score >= checks.length - 1 && numbers.length > 0 && mode !== 'off';

  return NextResponse.json({
    ready,
    score,
    total: checks.length,
    checks,
    inbound_mode: mode,
    number_count: numbers.length,
    primary_number: numbers[0]?.phone_number ?? null,
    last_inbound_at: recentInboundRes.data?.started_at ?? null,
    webhook_url: appUrl ? `${appUrl}/api/telnyx/webhook` : null,
  });
}
