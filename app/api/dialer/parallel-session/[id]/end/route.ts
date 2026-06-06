import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, apiForbidden } from '@/lib/api/errors';
import { cancelRingingLegs } from '@/lib/parallel-dial/dial-batch';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const { data: session } = await supabase
    .from('parallel_dial_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!session) return apiForbidden('Session not found');

  await cancelRingingLegs(supabase, id);

  const endedAt = new Date().toISOString();
  const durationSeconds = session.started_at
    ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    : 0;

  await supabase
    .from('parallel_dial_sessions')
    .update({ status: 'ended', ended_at: endedAt, updated_at: endedAt })
    .eq('id', id);

  const connectRate = session.total_dialed > 0
    ? Math.round((session.total_connects / session.total_dialed) * 100)
    : 0;

  return NextResponse.json({
    summary: {
      batches: session.total_batches,
      dialed: session.total_dialed,
      connects: session.total_connects,
      meetings: session.total_meetings,
      connect_rate: connectRate,
      duration_seconds: durationSeconds,
    },
  });
}
