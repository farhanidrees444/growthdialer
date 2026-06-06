import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';

export const dynamic = 'force-dynamic';

const MAX_NOTES_LENGTH = 5000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: callId } = await params;
    if (!callId) {
      return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { notes?: string };
    const notes = (body.notes ?? '').slice(0, MAX_NOTES_LENGTH);

    const access = await requireWorkspaceFromRequest(req, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const call = await requireCallAccess(
      supabase,
      { id: callId },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(call)) return call;

    const updatedAt = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('calls')
      .update({ notes, updated_at: updatedAt })
      .eq('id', callId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch (err) {
    console.error('[NOTES] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
