import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { processInboundRingTimeout } from '@/lib/inbound/ring-timeout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')?.trim();
  const expected = process.env.INTERNAL_API_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    inbound_call_id?: string;
    call_id?: string;
    call_control_id?: string;
    agent_id?: string;
    user_id?: string;
    ring_seconds?: number;
    inbound_mode?: string;
  };

  const inboundCallId = body.inbound_call_id ?? body.call_id;
  const agentId = body.agent_id ?? body.user_id;
  const callControlId = body.call_control_id;

  if (!inboundCallId || !callControlId || !agentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  void processInboundRingTimeout(supabase, {
    inboundCallId,
    callControlId,
    agentId,
    ringSeconds: body.ring_seconds ?? 25,
    inboundMode: body.inbound_mode ?? 'browser',
  }).catch((err) => {
    console.error('[inbound/ring-timeout] worker failed:', err);
  });

  return NextResponse.json({ ok: true, scheduled: true });
}
