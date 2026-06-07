import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

type Ctx = { params: Promise<{ id: string }> };

async function telnyxCallAction(callControlId: string, action: string, payload = {}) {
  const res = await fetch(
    `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/${action}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { errors?: { detail?: string }[] }).errors?.[0]?.detail ?? `${action} failed`;
    throw new Error(detail);
  }
  return res.json();
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id: callControlId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { action?: string };
  const { action } = body;
  if (action !== 'record_start' && action !== 'record_stop') {
    return NextResponse.json({ error: 'action must be record_start or record_stop' }, { status: 400 });
  }

  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
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
    const payload = action === 'record_start'
      ? { format: 'mp3', channels: 'dual', play_beep: false }
      : {};
    await telnyxCallAction(controlId, action, payload);

    if (action === 'record_start') {
      await supabase.from('calls').update({ was_recorded: true }).eq('id', call.id);
    }

    console.log(`[CALL-RECORD] ${action} success — call:`, call.id);
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Record action failed';
    console.error('[CALL-RECORD] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
