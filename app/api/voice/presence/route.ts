import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { upsertAgentPresence, type AgentPhoneStatus } from '@/lib/inbound/agent-presence';

const VALID_STATUSES = new Set<AgentPhoneStatus>([
  'idle', 'initializing', 'ready', 'error', 'offline',
]);

/** Heartbeat from browser WebRTC — drives inbound fallback when agent is offline. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      phone_status?: string;
      sip_username?: string;
      credential_id?: string;
      workspace_id?: string;
    };

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const phoneStatus = VALID_STATUSES.has(body.phone_status as AgentPhoneStatus)
      ? (body.phone_status as AgentPhoneStatus)
      : 'offline';

    await upsertAgentPresence(supabase, {
      userId: user.id,
      workspaceId: access.workspaceId,
      phoneStatus,
      sipUsername: body.sip_username ?? null,
      credentialId: body.credential_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[voice/presence] error:', err);
    return NextResponse.json({ error: 'Presence update failed' }, { status: 500 });
  }
}
