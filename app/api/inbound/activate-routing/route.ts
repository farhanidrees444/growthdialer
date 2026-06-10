import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { assignNumberToVoiceConnection, getNumberConnectionId } from '@/lib/voice/assign-number-connection';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const connectionId = process.env.TELNYX_CONNECTION_ID?.trim();
  if (!connectionId) {
    return NextResponse.json({
      error: 'Voice routing is not configured on the server.',
    }, { status: 503 });
  }

  const { data: numbers } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id')
    .eq('user_id', user.id)
    .neq('status', 'released');

  let activated = 0;
  let alreadyRouted = 0;
  let failed = 0;
  const results: { phone: string; status: 'activated' | 'already' | 'failed' | 'skipped' }[] = [];

  for (const num of numbers ?? []) {
    const telnyxId = num.telnyx_number_id as string | null;
    if (!telnyxId) {
      results.push({ phone: num.phone_number as string, status: 'skipped' });
      failed++;
      continue;
    }

    const current = await getNumberConnectionId(telnyxId);
    if (current === connectionId) {
      alreadyRouted++;
      results.push({ phone: num.phone_number as string, status: 'already' });
      continue;
    }

    const ok = await assignNumberToVoiceConnection(telnyxId);
    if (ok) {
      activated++;
      results.push({ phone: num.phone_number as string, status: 'activated' });
    } else {
      failed++;
      results.push({ phone: num.phone_number as string, status: 'failed' });
    }
  }

  return NextResponse.json({
    success: failed === 0,
    activated,
    already_routed: alreadyRouted,
    failed,
    total: (numbers ?? []).length,
    results,
    message:
      activated > 0
        ? `${activated} number(s) now route inbound calls to your browser.`
        : alreadyRouted > 0 && failed === 0
          ? 'All numbers are already configured for inbound.'
          : 'Some numbers could not be activated — contact support if this persists.',
  });
}
