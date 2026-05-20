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

    const { data, error } = await supabase
      .from('power_dial_sessions')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .eq('status', 'paused')
      .select('id, status, total_calls, connected_calls, meetings_booked, total_talk_time, started_at')
      .single();

    if (error) {
      console.error('[power-session/resume]', error);
      return NextResponse.json({ error: 'Could not resume session' }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    console.error('[power-session/resume]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
