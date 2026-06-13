import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';
import { prepareVoiceAccount } from '@/lib/voice/prepare-voice-account';

/**
 * Repair voice for the logged-in account — inbound routing + outbound credential.
 * Safe to call on every dashboard session (idempotent).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await prepareVoiceAccount(supabase, user.id, user.email ?? '');

  return NextResponse.json({
    success: result.primary_routed && result.credential_ready && result.outbound_ready,
    ...result,
  });
}
