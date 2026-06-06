import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUS_TO_DISPOSITION } from '@/lib/dialer/state-machine';
import type { DispositionType } from '@/lib/dialer/state-machine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      disposition: DispositionType;
      notes?: string;
      callback_at?: string;
      meeting_at?: string;
    };
    const { disposition, notes, callback_at, meeting_at } = body;

    if (!disposition) return NextResponse.json({ error: 'Missing disposition' }, { status: 400 });

    // Get call + current lead data in one shot
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id, lead_id, user_id, disposition')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (callError || !call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    const leadStatus = LEAD_STATUS_TO_DISPOSITION[disposition];
    const now = new Date().toISOString();

    // Update call record
    const callUpdate: Record<string, unknown> = {
      disposition,
      disposition_notes: notes ?? null,
      notes: notes ?? null,
      updated_at: now,
    };
    await supabase.from('calls').update(callUpdate).eq('id', id);

    if (call.lead_id) {
      // Fetch current lead to append notes properly
      const { data: currentLead } = await supabase
        .from('leads')
        .select('notes, call_attempts')
        .eq('id', call.lead_id)
        .single();

      // Append note with timestamp + disposition label
      let updatedNotes: string | null = currentLead?.notes ?? null;
      if (notes && notes.trim()) {
        const label = disposition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const stamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const entry = `[${stamp} · ${label}] ${notes.trim()}`;
        updatedNotes = updatedNotes ? `${updatedNotes}\n${entry}` : entry;
      }

      const isFirstDisposition = !call.disposition;
      const leadUpdate: Record<string, unknown> = {
        status: leadStatus,
        last_called_at: now,
        ...(isFirstDisposition
          ? { call_attempts: (currentLead?.call_attempts ?? 0) + 1 }
          : {}),
        ...(updatedNotes !== null ? { notes: updatedNotes } : {}),
        ...(disposition === 'dnc' ? { dnc: true } : {}),
        ...(disposition === 'wrong_number' ? { status: 'wrong_number' } : {}),
        ...(callback_at ? { callback_at } : {}),
        ...(meeting_at ? { meeting_at } : {}),
      };

      // wrong_number overrides generic leadStatus
      if (disposition === 'wrong_number') {
        leadUpdate.status = 'wrong_number';
      }

      await supabase.from('leads').update(leadUpdate).eq('id', call.lead_id);

      // Activity log entry
      const activitySummary = buildActivitySummary(disposition, notes);
      await supabase.from('lead_activities').insert({
        lead_id: call.lead_id,
        user_id: user.id,
        call_id: id,
        type: 'call',
        disposition,
        notes: activitySummary,
        created_at: now,
      }).then(() => { /* fire-and-forget — don't fail disposition save if activity table missing */ });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[calls/disposition]', err);
    return NextResponse.json({ error: 'Failed to save disposition' }, { status: 500 });
  }
}

function buildActivitySummary(disposition: DispositionType, notes?: string): string {
  const labels: Record<DispositionType, string> = {
    interested: 'Lead expressed interest',
    meeting_booked: 'Meeting booked',
    callback: 'Callback scheduled',
    voicemail: 'Left voicemail',
    gatekeeper: 'Reached gatekeeper',
    not_interested: 'Not interested',
    wrong_number: 'Wrong number',
    dnc: 'Added to do-not-call list',
  };
  const base = labels[disposition] ?? disposition;
  return notes?.trim() ? `${base}: ${notes.trim()}` : base;
}
