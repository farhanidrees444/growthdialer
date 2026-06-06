import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { dispositionRequestSchema } from '@/lib/validations';
import { getWorkspaceDispositions, dispositionMeta, isValidWorkspaceDisposition } from '@/lib/dispositions/workspace';
import { logCallToHubspot } from '@/lib/integrations/hubspot';
import { advanceSequenceAfterCall } from '@/lib/sequences/advance';

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

    const valid = await isValidWorkspaceDisposition(supabase, access.workspaceId, disposition);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid disposition' }, { status: 400 });
    }

    const dispositions = await getWorkspaceDispositions(supabase, access.workspaceId);
    const meta = dispositionMeta(dispositions, disposition);

    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(call)) return call;

    const leadStatus = meta?.lead_status ?? 'contacted';
    const now = new Date().toISOString();

    const callUpdate: Record<string, unknown> = {
      disposition,
      disposition_notes: notes ?? null,
      notes: notes ?? null,
      updated_at: now,
    };
    await supabase.from('calls').update(callUpdate).eq('id', id);

    if (call.lead_id) {
      const { data: currentLead } = await supabase
        .from('leads')
        .select('notes, call_attempts, name, phone')
        .eq('id', call.lead_id)
        .eq('workspace_id', access.workspaceId)
        .single();

      let updatedNotes: string | null = currentLead?.notes ?? null;
      if (notes && notes.trim()) {
        const label = meta?.label ?? disposition.replace(/_/g, ' ');
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
        ...(meta?.sets_dnc ? { dnc: true } : {}),
        ...(meta?.triggers_callback && callback_at ? { callback_at } : {}),
        ...(meta?.triggers_meeting && meeting_at ? { meeting_at } : {}),
      };

      if (disposition === 'wrong_number') {
        leadUpdate.status = 'wrong_number';
      }

      await supabase
        .from('leads')
        .update(leadUpdate)
        .eq('id', call.lead_id)
        .eq('workspace_id', access.workspaceId);

      const activitySummary = buildActivitySummary(meta?.label ?? disposition, notes);
      void supabase.from('lead_activities').insert({
        lead_id: call.lead_id,
        user_id: user.id,
        call_id: id,
        type: 'call',
        disposition,
        notes: activitySummary,
        created_at: now,
      });

      void advanceSequenceAfterCall(supabase, access.workspaceId, call.lead_id);

      if (currentLead?.phone) {
        const { data: callMeta } = await supabase
          .from('calls')
          .select('duration_seconds, direction')
          .eq('id', id)
          .single();
        void logCallToHubspot(supabase, {
          workspaceId: access.workspaceId,
          userId: user.id,
          leadPhone: currentLead.phone,
          leadName: currentLead.name ?? 'Lead',
          disposition,
          notes,
          durationSeconds: callMeta?.duration_seconds ?? undefined,
          direction: callMeta?.direction ?? 'outbound',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[calls/disposition]', err);
    return NextResponse.json({ error: 'Failed to save disposition' }, { status: 500 });
  }
}

function buildActivitySummary(label: string, notes?: string): string {
  const base = label || 'Call logged';
  return notes?.trim() ? `${base}: ${notes.trim()}` : base;
}
