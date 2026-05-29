import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: call } = await supabase
      .from('calls')
      .select('telnyx_call_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!call?.telnyx_call_id) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const res = await fetch(
      `https://api.telnyx.com/v2/calls/${call.telnyx_call_id}/actions/answer`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('[ANSWER] Telnyx error:', res.status, errText.slice(0, 200));
      return NextResponse.json({ error: 'Answer failed' }, { status: 500 });
    }

    await supabase
      .from('calls')
      .update({ status: 'in_progress', answered_at: new Date().toISOString() })
      .eq('id', id);

    console.log('[ANSWER] Inbound call answered:', id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
