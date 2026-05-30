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

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Update DB immediately — must happen regardless of whether REST answer succeeds.
    // Browser/WebRTC mode answers via the SDK (not REST), so REST may return an error
    // for browser-delivered calls; that is expected and non-fatal.
    await supabase
      .from('calls')
      .update({ status: 'in_progress', answered_at: new Date().toISOString() })
      .eq('id', id);

    // Attempt Telnyx Call Control answer — needed for forward/transfer modes.
    // For WebRTC browser mode, the SDK has already answered the call; this is a no-op.
    if (call.telnyx_call_id) {
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
        // 4xx from Telnyx for a browser-answered call is expected; just log it.
        console.warn('[ANSWER] Telnyx REST answer returned', res.status, errText.slice(0, 200), '— browser WebRTC answer is primary');
      }
    }

    console.log('[ANSWER] Inbound call answered:', id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[ANSWER] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
