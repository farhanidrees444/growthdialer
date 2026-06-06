import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, apiForbidden } from '@/lib/api/errors';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const { data: legs } = await supabase
      .from('parallel_dial_legs')
      .select('*')
      .eq('session_id', id)
      .order('batch_number', { ascending: false })
      .order('created_at', { ascending: true });

    return NextResponse.json({ session, legs: legs ?? [] });
  } catch (err) {
    console.error('[parallel-session/GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
