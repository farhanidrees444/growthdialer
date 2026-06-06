import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id: callControlId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  if (!hasPermission(access.role, 'MAKE_CALLS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const call = await requireCallAccess(
    supabase,
    { id: callControlId, telnyxCallId: callControlId },
    access,
    user.id,
    'control',
  );
  if (isCallAccessError(call)) return call;

  const controlId = call.telnyx_call_id ?? callControlId;

  try {
    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${encodeURIComponent(controlId)}/actions/hangup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    if (!res.ok && res.status !== 404) {
      const err = await res.json().catch(() => ({}));
      const detail = (err as { errors?: { detail?: string }[] }).errors?.[0]?.detail ?? 'Hangup failed';
      console.error('[CALL-END] Telnyx error:', detail);
      return NextResponse.json({ error: detail }, { status: 500 });
    }

    await supabase
      .from('calls')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', call.id);

    console.log('[CALL-END] Success — call:', call.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'End call failed';
    console.error('[CALL-END] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
