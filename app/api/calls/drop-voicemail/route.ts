import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      call_control_id: string;
      call_db_id?: string;
      voicemail_id?: string;
    };
    const { call_control_id } = body;

    if (!call_control_id) {
      return NextResponse.json({ error: 'Missing call_control_id' }, { status: 400 });
    }

    const access = await requireWorkspaceFromRequest(req, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const callRow = await requireCallAccess(
      supabase,
      { telnyxCallId: call_control_id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(callRow)) return callRow;

    return NextResponse.json(
      { error: 'Voicemail drop is not available for this voice backend yet.' },
      { status: 501 },
    );
  } catch (err) {
    console.error('[VM DROP] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
