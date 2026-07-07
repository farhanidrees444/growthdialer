import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { agent_id?: string; message?: string; call_id?: string; workspace_id?: string };
  const userId = user.id;
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, {
    permission: 'COACH_CALLS',
    body,
  });
  if (isWorkspaceError(access)) return access;

  const agentId = body.agent_id?.trim();
  const message = body.message?.trim();
  const callId = body.call_id?.trim();
  if (!agentId || !message) return NextResponse.json({ error: 'agent_id and message required' }, { status: 400 });
  if (message.length > 1200) return NextResponse.json({ error: 'Message is too long' }, { status: 400 });

  if (agentId === userId) {
    return NextResponse.json({ error: 'Cannot whisper to yourself' }, { status: 400 });
  }

  if (callId) {
    const { data: call } = await supabase
      .from('calls')
      .select('id, user_id, workspace_id')
      .eq('id', callId)
      .eq('user_id', agentId)
      .maybeSingle();
    if (!call) return NextResponse.json({ error: 'Call not found for agent' }, { status: 404 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Realtime service unavailable' }, { status: 503 });

  const channel = service.channel(`coaching:agent_${agentId}`);
  await channel.send({
    type: 'broadcast',
    event: 'whisper',
    payload: {
      call_id: callId ?? null,
      coach_id: user.id,
      message,
      sent_at: new Date().toISOString(),
    },
  });
  await service.removeChannel(channel);

  return NextResponse.json({ ok: true });
}
