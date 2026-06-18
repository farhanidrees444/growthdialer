import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { getVoiceProvider } from '@/lib/voice/provider';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
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

  const provider = getVoiceProvider();
  const configured = provider === 'twilio' ? isTwilioVoiceConfigured() : Boolean(process.env.TELNYX_API_KEY);
  const webhookUrl = resolveVoiceWebhookUrl();
  const blockers: string[] = [];
  if (!configured) blockers.push('Voice credentials not configured');
  if (!webhookUrl) blockers.push('APP_URL missing');

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('phone_number, is_default')
    .eq('user_id', user.id)
    .eq('status', 'active');

  return NextResponse.json({
    ok: configured && blockers.length === 0 && (numbers?.length ?? 0) > 0,
    provider,
    webhook_url: webhookUrl || null,
    number_count: numbers?.length ?? 0,
    blockers,
  });
}
