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
    };
    const { disposition, notes, callback_at } = body;

    if (!disposition) return NextResponse.json({ error: 'Missing disposition' }, { status: 400 });

    // Get the call to find the lead
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id, lead_id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (callError || !call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    const leadStatus = LEAD_STATUS_TO_DISPOSITION[disposition];

    // Update call disposition
    const callUpdate: Record<string, unknown> = {
      disposition,
      disposition_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    };
    if (notes) callUpdate.notes = notes;

    const [{ error: callUpdateError }, leadUpdateResult] = await Promise.all([
      supabase.from('calls').update(callUpdate).eq('id', id),
      call.lead_id
        ? supabase
            .from('leads')
            .update({
              status: leadStatus,
              ...(disposition === 'dnc' ? { dnc: true } : {}),
              ...(callback_at ? { callback_at } : {}),
              last_called_at: new Date().toISOString(),
            })
            .eq('id', call.lead_id)
        : Promise.resolve({ error: null }),
    ]);

    if (callUpdateError) throw callUpdateError;
    if (leadUpdateResult?.error) throw leadUpdateResult.error;

    // Find next lead for auto-advance
    const { data: nextLead } = call.lead_id
      ? await supabase
          .from('leads')
          .select('id, name')
          .eq('user_id', user.id)
          .not('status', 'in', '("do_not_call","meeting_booked")')
          .eq('dnc', false)
          .neq('id', call.lead_id)
          .order('ai_score', { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    return NextResponse.json({ success: true, nextLeadId: nextLead?.id ?? null });
  } catch (err) {
    console.error('[calls/disposition]', err);
    return NextResponse.json({ error: 'Failed to save disposition' }, { status: 500 });
  }
}
