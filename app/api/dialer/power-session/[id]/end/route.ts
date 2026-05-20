import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const endedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('power_dial_sessions')
      .update({ status: 'ended', ended_at: endedAt })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('id, started_at, ended_at, total_calls, connected_calls, meetings_booked, total_talk_time')
      .single();

    if (error) {
      console.error('[power-session/end]', error);
      return NextResponse.json({ error: 'Could not end session' }, { status: 500 });
    }

    const startedAt = data.started_at ? new Date(data.started_at).getTime() : Date.now();
    const endedAtMs = data.ended_at ? new Date(data.ended_at).getTime() : Date.now();
    const durationSeconds = Math.floor((endedAtMs - startedAt) / 1000);

    return NextResponse.json({
      session: data,
      summary: {
        calls: data.total_calls,
        connects: data.connected_calls,
        meetings: data.meetings_booked,
        duration: durationSeconds,
      },
    });
  } catch (err) {
    console.error('[power-session/end]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
