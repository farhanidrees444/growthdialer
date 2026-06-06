import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_NOTES_LENGTH = 5000;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: callId } = await params;
    if (!callId) {
      return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { notes?: string };
    const notes = (body.notes ?? '').slice(0, MAX_NOTES_LENGTH);

    const { data: call, error: fetchErr } = await supabase
      .from('calls')
      .select('id')
      .eq('id', callId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('calls')
      .update({ notes, updated_at: updatedAt })
      .eq('id', callId)
      .eq('user_id', user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch (err) {
    console.error('[NOTES] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
