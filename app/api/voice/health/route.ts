import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { resolveActiveCredentialId } from '@/lib/telnyx/active-credential';
import { ensureVoiceConnectionConfigured } from '@/lib/voice/configure-connection';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { snapshotVoiceEnv } from '@/lib/voice/voice-readiness';

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

  const env = snapshotVoiceEnv();
  const webhookUrl = resolveVoiceWebhookUrl();
  const blockers: string[] = [];

  if (!env.configured) blockers.push('Voice credentials not configured on server');
  if (!webhookUrl) blockers.push('APP_URL missing');
  if (!env.webhookSignatureReady) blockers.push('Voice webhook signature key not configured');

  const [connection, credentialId, numbersRes] = await Promise.all([
    ensureVoiceConnectionConfigured(),
    resolveActiveCredentialId(supabase, user.id),
    supabase
      .from('purchased_numbers')
      .select('phone_number, is_default')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ]);

  if (!connection.ok) blockers.push('Voice connection not ready');
  if (!credentialId) blockers.push('Browser voice endpoint not ready');

  const numbers = numbersRes.data ?? [];

  return NextResponse.json({
    ok: env.configured && blockers.length === 0 && numbers.length > 0,
    provider: env.provider,
    webhook_url: webhookUrl || null,
    number_count: numbers.length,
    credential_ready: Boolean(credentialId),
    connection_ready: connection.ok,
    blockers,
  });
}
