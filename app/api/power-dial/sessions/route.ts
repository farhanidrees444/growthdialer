import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('power_dial_sessions')
      .insert({ user_id: userId })
      .select('id, started_at, total_calls, connected_calls, meetings_booked, total_talk_time, status')
      .single();

    if (error) {
      console.error('[power-dial] create session error:', error);
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[power-dial] create session error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('power_dial_sessions')
      .select('id, started_at, ended_at, total_calls, connected_calls, meetings_booked, total_talk_time, status')
      .eq('user_id', userId)
      .gte('started_at', thirtyDaysAgo)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[power-dial] fetch sessions error:', error);
      return NextResponse.json({ error: 'Could not fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    console.error('[power-dial] fetch sessions error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
