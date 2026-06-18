import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitParam = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 8;

  const { data, error } = await supabase
    .from('inbound_calls')
    .select('id, twilio_call_sid, from_number, to_number, status, started_at, answered_at, ended_at, duration_seconds, voicemail_recording_url, created_at')
    .eq('routed_agent_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[incoming/history]', error);
    return NextResponse.json({ calls: [] });
  }

  const calls = (data ?? []).map((row) => ({
    id: row.id,
    direction: 'inbound',
    status: row.status,
    disposition: row.status === 'voicemail' ? 'voicemail' : row.status === 'missed' ? 'missed' : null,
    from_number: row.from_number,
    to_number: row.to_number,
    duration_seconds: row.duration_seconds,
    started_at: row.started_at,
    created_at: row.created_at ?? row.started_at,
    answered_at: row.answered_at,
    ended_at: row.ended_at,
    recording_url: row.voicemail_recording_url,
    was_recorded: Boolean(row.voicemail_recording_url),
    lead_id: null,
    leads: null,
  }));

  return NextResponse.json({ calls });
}
