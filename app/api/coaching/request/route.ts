import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/coaching/request — agent requests coaching on their active call
// Body: { call_id: string }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { call_id } = await request.json() as { call_id?: string };
  if (!call_id) return NextResponse.json({ error: 'call_id required' }, { status: 400 });

  // Verify call belongs to agent
  const { data: call } = await supabase
    .from('calls')
    .select('id, workspace_id, status')
    .eq('id', call_id)
    .eq('user_id', user.id)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (call.status === 'ended') return NextResponse.json({ error: 'Call has ended' }, { status: 410 });

  // Upsert a coaching_request notification record so managers can see it
  // We reuse coaching_sessions with mode='requested' and no ended_at as a pending request
  await supabase
    .from('coaching_sessions')
    .upsert({
      call_id,
      agent_id: user.id,
      coach_id: user.id, // self-request placeholder
      workspace_id: call.workspace_id,
      mode: 'listen',
      started_at: new Date().toISOString(),
    }, { onConflict: 'call_id,coach_id' });

  return NextResponse.json({ ok: true });
}
