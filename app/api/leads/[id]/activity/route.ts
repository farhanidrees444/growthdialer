import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    const { id } = await params;

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch calls for this lead
    const { data: calls } = await supabase
      .from('calls')
      .select('id, status, duration_seconds, hangup_cause, recording_url, created_at, answered_at, notes, disposition')
      .eq('lead_id', id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch activities if table exists (migration 003)
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Build unified timeline
    const timeline: Array<{
      id: string;
      type: string;
      label: string;
      detail: string | null;
      created_at: string;
      meta?: Record<string, unknown>;
    }> = [];

    for (const call of calls ?? []) {
      const dur = call.duration_seconds ?? 0;
      const durLabel = dur > 0
        ? `${Math.floor(dur / 60)}m ${dur % 60}s`
        : 'No answer';

      let disposition = call.disposition ?? call.hangup_cause ?? null;
      if (disposition === 'normal_clearing') disposition = 'Answered';
      if (disposition === 'user_busy') disposition = 'Busy';
      if (disposition === 'no_answer') disposition = 'No answer';

      timeline.push({
        id: `call-${call.id}`,
        type: 'call',
        label: dur > 0 ? `Call — ${durLabel}` : 'Call — No answer',
        detail: disposition,
        created_at: call.created_at,
        meta: {
          duration_seconds: dur,
          recording_url: call.recording_url,
          notes: call.notes,
          call_id: call.id,
        },
      });
    }

    for (const act of activities ?? []) {
      const type = act.event_type ?? act.type ?? 'event';
      timeline.push({
        id: `act-${act.id}`,
        type,
        label: humanizeActivityType(type),
        detail: act.data ? summarizeActivity(type, act.data) : null,
        created_at: act.created_at,
        meta: act.data ?? {},
      });
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ timeline });
  } catch (err) {
    console.error('GET activity error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function humanizeActivityType(type: string): string {
  const map: Record<string, string> = {
    'call.initiated':  'Call initiated',
    'call.answered':   'Call answered',
    'call.hangup':     'Call ended',
    'recording.saved': 'Recording saved',
    'status_change':   'Status changed',
    'note_added':      'Note added',
    'import':          'Imported',
    'created':         'Lead created',
  };
  return map[type] ?? type.replace(/_/g, ' ');
}

function summarizeActivity(type: string, data: Record<string, unknown>): string | null {
  if (type === 'status_change' && data.to) return `→ ${data.to}`;
  if (type === 'note_added' && typeof data.note === 'string') return data.note.slice(0, 80);
  return null;
}
