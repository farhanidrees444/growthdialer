import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import { ringBrowserForInbound } from '@/lib/inbound/bridge-to-browser';

/**
 * Re-dial the agent's WebRTC leg when the DB ring row exists but the browser
 * never received a Telnyx invite (common race on slow token connect).
 */
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

    if (call.direction !== 'inbound') {
      return NextResponse.json({ error: 'Not an inbound call' }, { status: 400 });
    }

    if (!call.status || !['ringing', 'in_progress'].includes(call.status)) {
      return NextResponse.json({ error: 'Call is no longer answerable' }, { status: 409 });
    }

    if (call.telnyx_webrtc_leg_id) {
      return NextResponse.json({
        ok: true,
        created: false,
        webrtc_leg_id: call.telnyx_webrtc_leg_id,
      });
    }

    if (!call.telnyx_call_id || !call.to_number) {
      return NextResponse.json({ error: 'Missing PSTN leg metadata' }, { status: 422 });
    }

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const result = await ringBrowserForInbound(
      service,
      user.id,
      call.telnyx_call_id,
      call.to_number,
      call.from_number ?? '',
      call.id,
    );

    if (!result.ok) {
      console.error('[ENSURE-BROWSER-LEG] dial failed for call:', call.id);
      return NextResponse.json({ ok: false, error: 'Browser leg dial failed' }, { status: 503 });
    }

    console.log('[ENSURE-BROWSER-LEG] Browser leg (re)dialed:', result.webrtc_leg_id, '| call:', call.id);
    return NextResponse.json({
      ok: true,
      created: true,
      webrtc_leg_id: result.webrtc_leg_id ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ENSURE-BROWSER-LEG] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
