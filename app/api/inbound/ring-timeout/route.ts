import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { processInboundRingTimeout } from '@/lib/inbound/ring-timeout';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_API_SECRET?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    call_id?: string;
    call_control_id?: string;
    user_id?: string;
    ring_seconds?: number;
    inbound_mode?: string;
  };

  const { call_id, call_control_id, user_id, ring_seconds, inbound_mode } = body;
  if (!call_id || !call_control_id || !user_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  await processInboundRingTimeout(supabase, {
    callId: call_id,
    callControlId: call_control_id,
    userId: user_id,
    ringSeconds: ring_seconds ?? 25,
    inboundMode: inbound_mode ?? 'browser',
  });

  return NextResponse.json({ ok: true });
}
