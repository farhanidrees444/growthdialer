import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertAgentPresence } from '@/lib/inbound/agent-presence';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    presence_status?: 'online' | 'away' | 'offline';
    device_state?: string | null;
    phone_status?: 'idle' | 'initializing' | 'ready' | 'error' | 'offline';
    tab_id?: string | null;
    workspace_id?: string | null;
  };

  const presenceStatus = body.presence_status ?? 'online';
  const phoneStatus = body.phone_status ?? 'ready';

  await upsertAgentPresence(supabase, {
    userId: user.id,
    workspaceId: body.workspace_id ?? null,
    phoneStatus,
    presenceStatus,
    deviceState: body.device_state ?? null,
    tabId: body.tab_id ?? null,
  });

  return NextResponse.json({ ok: true });
}
