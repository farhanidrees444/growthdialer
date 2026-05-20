import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('power_dial_sessions')
      .select('id, started_at, total_calls, connected_calls, meetings_booked, total_talk_time, status')
      .eq('user_id', session.user.id)
      .in('status', ['active', 'paused'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ activeSession: data ?? null });
  } catch (err) {
    console.error('[power-session/active]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
