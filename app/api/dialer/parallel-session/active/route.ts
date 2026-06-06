import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized } from '@/lib/api/errors';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const { data: session } = await supabase
      .from('parallel_dial_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused', 'dialing', 'connected', 'disposition'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ session: null, legs: [] });
    }

    const { data: legs } = await supabase
      .from('parallel_dial_legs')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ session, legs: legs ?? [] });
  } catch (err) {
    console.error('[parallel-session/active]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
