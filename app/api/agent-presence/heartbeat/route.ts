import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  upsertCleanAgentPresence,
  type AgentPhoneStatus,
  type AgentReachabilityStatus,
} from '@/lib/voice/agent-presence';

const VALID_REACHABILITY = new Set<AgentReachabilityStatus>(['online', 'away', 'offline']);
const VALID_PHONE_STATUS = new Set<AgentPhoneStatus>([
  'idle',
  'initializing',
  'ready',
  'error',
  'offline',
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    presence_status?: string;
    phone_status?: string;
    device_state?: string | null;
    tab_id?: string | null;
    workspace_id?: string | null;
  };

  const status = VALID_REACHABILITY.has(body.presence_status as AgentReachabilityStatus)
    ? (body.presence_status as AgentReachabilityStatus)
    : 'offline';

  const phoneStatus = VALID_PHONE_STATUS.has(body.phone_status as AgentPhoneStatus)
    ? (body.phone_status as AgentPhoneStatus)
    : 'offline';

  try {
    await upsertCleanAgentPresence(supabase, {
      agentId: user.id,
      workspaceId: body.workspace_id ?? null,
      status,
      phoneStatus,
      deviceState: body.device_state ?? null,
      tabId: body.tab_id ?? null,
    });
  } catch (error) {
    console.error('[agent-presence/heartbeat]', error);
    return NextResponse.json({ error: 'Presence update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

