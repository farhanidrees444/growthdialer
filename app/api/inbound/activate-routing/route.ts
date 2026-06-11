import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import {
  forceAssignAllNumbersToConnection,
  auditNumberRouting,
  backfillProviderIds,
  fetchProviderPhoneIndex,
} from '@/lib/voice/provider-numbers';
import { getActiveVoiceConnectionId } from '@/lib/voice/configure-connection';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const connectionId = await getActiveVoiceConnectionId();
  if (!connectionId) {
    return NextResponse.json({
      error: 'Voice routing is not configured on the server.',
    }, { status: 503 });
  }

  const { data: rows } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, is_default')
    .eq('user_id', user.id)
    .neq('status', 'released');

  const numbers = (rows ?? []).map((n) => ({
    id: n.id as string,
    phone_number: n.phone_number as string,
    telnyx_number_id: n.telnyx_number_id as string | null,
    is_default: Boolean(n.is_default),
  }));

  const providerIndex = await fetchProviderPhoneIndex();
  await backfillProviderIds(supabase, numbers, providerIndex);

  const before = await auditNumberRouting(numbers, connectionId, providerIndex);
  if (!before.needs_activation) {
    return NextResponse.json({
      success: true,
      activated: 0,
      already_routed: before.routed,
      failed: 0,
      total: before.total,
      message: 'All numbers are already linked for inbound.',
    });
  }

  const result = await forceAssignAllNumbersToConnection(numbers, connectionId, providerIndex);
  const after = await auditNumberRouting(numbers, connectionId, providerIndex);

  const message =
    result.activated > 0
      ? `${result.activated} number(s) linked — inbound is ready.`
      : after.primary_routed
        ? 'Your primary line is linked for inbound.'
        : result.already_routed > 0
          ? 'Numbers are linked on the voice network — refresh in a moment.'
          : 'We could not link every number. Try again or contact support.';

  return NextResponse.json({
    success: result.failed === 0 || after.primary_routed,
    activated: result.activated,
    already_routed: result.already_routed,
    failed: result.failed,
    total: numbers.length,
    primary_routed: after.primary_routed,
    results: result.results,
    message,
  });
}
