import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { prepareInboundAccount } from '@/lib/inbound/prepare-account';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import { listTwilioInboundBlockers } from '@/lib/twilio/twilio-readiness';
import { resolveInboundAppUrl } from '@/lib/voice/inbound-readiness';

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

  const webhookUrl = resolveVoiceWebhookUrl();
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const appUrl = resolveInboundAppUrl(host);

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, is_default, status')
    .eq('user_id', user.id)
    .neq('status', 'released');

  const prepare = await prepareInboundAccount(supabase, user.id, user.email ?? '');

  const blockers = isTwilioVoiceConfigured()
    ? listTwilioInboundBlockers({
        hasNumbers: (numbers?.length ?? 0) > 0,
        inboundEnabled: true,
        browserAnswering: true,
        appUrl,
      })
    : [{ code: 'voice', label: 'Voice not configured', fix: 'Configure voice credentials on server.' }];

  return NextResponse.json({
    provider: 'twilio',
    voice_configured: isTwilioVoiceConfigured(),
    webhook_url: webhookUrl || null,
    app_url: appUrl || null,
    numbers: numbers ?? [],
    prepare,
    blockers,
  });
}
