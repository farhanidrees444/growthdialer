import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { readCallControlAppId } from '@/lib/voice/read-env';
import {
  auditNumberRouting,
  backfillProviderIds,
  fetchProviderPhoneIndex,
  forceAssignAllNumbersToConnection,
  type DbNumberRow,
} from '@/lib/voice/provider-numbers';

/**
 * Part 9 health check — lists any number on the account with no Connection
 * assigned. Drift here means the number has no inbound routing and no
 * outbound permissions; this must never fail silently.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;
  if (access.role !== 'owner' && access.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const connectionId = readCallControlAppId();
  if (!connectionId) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  const { data: numbers, error } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, is_default')
    .eq('user_id', user.id)
    .neq('status', 'released');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (numbers ?? []) as DbNumberRow[];
  const providerIndex = await fetchProviderPhoneIndex();
  await backfillProviderIds(supabase, rows, providerIndex);

  const audit = await auditNumberRouting(rows, connectionId, providerIndex);

  return NextResponse.json({
    connection_id: connectionId,
    healthy: !audit.needs_activation,
    ...audit,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;
  if (access.role !== 'owner' && access.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const connectionId = readCallControlAppId();
  if (!connectionId) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  const { data: numbers, error } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, is_default')
    .eq('user_id', user.id)
    .neq('status', 'released');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (numbers ?? []) as DbNumberRow[];
  const providerIndex = await fetchProviderPhoneIndex();
  await backfillProviderIds(supabase, rows, providerIndex);

  const result = await forceAssignAllNumbersToConnection(rows, connectionId, providerIndex);
  return NextResponse.json(result);
}
