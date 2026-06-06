import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUS_TO_DISPOSITION, type DispositionType } from '@/lib/dialer/state-machine';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { dispositionRequestSchema } from '@/lib/validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, dispositionRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { disposition, notes, callback_at, meeting_at } = parsed.data;

    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body: rawBody });
    if (isWorkspaceError(access)) return access;

    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(call)) return call;

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
        .eq('workspace_id', access.workspaceId)
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

      await supabase
        .from('leads')
        .update(leadUpdate)
        .eq('id', call.lead_id)
        .eq('workspace_id', access.workspaceId);

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
