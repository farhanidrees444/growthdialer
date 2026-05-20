import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const body = await request.json() as { excludeLeadId?: string; calledLeadIds?: string[] };
    const { excludeLeadId, calledLeadIds = [] } = body;

    // Verify session belongs to user and is active
    const { data: powerSession } = await supabase
      .from('power_dial_sessions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!powerSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (powerSession.status !== 'active') return NextResponse.json({ nextLead: null, done: true });

    // Build exclusion list: current lead + all leads called in this session
    const excluded = [...calledLeadIds];
    if (excludeLeadId && !excluded.includes(excludeLeadId)) excluded.push(excludeLeadId);

    let query = supabase
      .from('leads')
      .select('id, name, title, company, phone, email, status, ai_score, last_called_at, call_attempts, tags, notes, dnc')
      .eq('user_id', userId)
      .not('status', 'in', '("do_not_call","meeting_booked")')
      .eq('dnc', false)
      .order('ai_score', { ascending: false })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (excluded.length > 0) {
      query = query.not('id', 'in', `(${excluded.map((id) => `"${id}"`).join(',')})`);
    }

    const { data: leads } = await query;
    const nextLead = leads?.[0] ?? null;

    return NextResponse.json({ nextLead, done: !nextLead });
  } catch (err) {
    console.error('[power-session/next]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
