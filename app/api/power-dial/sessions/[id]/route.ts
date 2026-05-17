import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.status === 'ended') updates.ended_at = new Date().toISOString();
    if (typeof body.total_calls === 'number') updates.total_calls = body.total_calls;
    if (typeof body.connected_calls === 'number') updates.connected_calls = body.connected_calls;
    if (typeof body.meetings_booked === 'number') updates.meetings_booked = body.meetings_booked;
    if (typeof body.total_talk_time === 'number') updates.total_talk_time = body.total_talk_time;

    const { error } = await supabase
      .from('power_dial_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[power-dial] update session error:', error);
      return NextResponse.json({ error: 'Could not update session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[power-dial] update session error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
