import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };

async function telnyxCallAction(callControlId: string, action: string, payload = {}) {
  const res = await fetch(
    `https://api.telnyx.com/v2/calls/${encodeURIComponent(callControlId)}/actions/${action}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { errors?: { detail?: string }[] }).errors?.[0]?.detail ?? `Telnyx ${action} failed`;
    throw new Error(detail);
  }
  return res.json();
}

// POST /api/calls/[id]/hold
// Body: { action: 'hold' | 'unhold' }
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id: callControlId } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json() as { action?: string };
  if (action !== 'hold' && action !== 'unhold') {
    return NextResponse.json({ error: 'action must be hold or unhold' }, { status: 400 });
  }

  const { data: call } = await supabase
    .from('calls')
    .select('id, telnyx_call_id')
    .or(`id.eq.${callControlId},telnyx_call_id.eq.${callControlId}`)
    .eq('user_id', session.user.id)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const controlId = call.telnyx_call_id ?? callControlId;

  try {
    await telnyxCallAction(controlId, action === 'hold' ? 'hold' : 'unhold');
    console.log(`[CALL-HOLD] ${action} success — call:`, call.id);
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hold action failed';
    console.error('[CALL-HOLD] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
