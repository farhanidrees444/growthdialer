import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(call)) return call;

    if (call.direction === 'inbound' && call.status && !['ringing', 'in_progress'].includes(call.status)) {
      return NextResponse.json({ error: 'Call is no longer answerable' }, { status: 409 });
    }

    await supabase
      .from('calls')
      .update({ status: 'in_progress', answered_at: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['ringing', 'in_progress']);

    // Media bridge is handled by Telnyx bridge_on_answer when the browser leg answers.
    console.log('[ANSWER] Inbound call answered:', id);
    return NextResponse.json({ success: true, bridged: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
