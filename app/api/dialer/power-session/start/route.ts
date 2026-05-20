import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // End any existing active session first
    await supabase
      .from('power_dial_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new session
    const { data: powerSession, error: sessionError } = await supabase
      .from('power_dial_sessions')
      .insert({ user_id: userId, status: 'active' })
      .select('id, started_at, total_calls, connected_calls, meetings_booked, total_talk_time, status')
      .single();

    if (sessionError || !powerSession) {
      console.error('[power-session/start]', sessionError);
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    // Fetch first lead from queue (priority sort, skip already-called today if possible)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, name, title, company, phone, email, status, ai_score, last_called_at, call_attempts, tags, notes, dnc')
      .eq('user_id', userId)
      .not('status', 'in', '("do_not_call","meeting_booked")')
      .eq('dnc', false)
      .order('ai_score', { ascending: false })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(50);

    const queue = leads ?? [];
    const firstLead = queue[0] ?? null;

    return NextResponse.json({
      session: powerSession,
      firstLead,
      queueSize: queue.length,
    });
  } catch (err) {
    console.error('[power-session/start]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
