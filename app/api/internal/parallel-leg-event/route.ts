import { NextRequest, NextResponse } from 'next/server';
import type { ParallelLegTrackingEvent } from '@/lib/parallel-dial/leg-tracking';

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret || request.headers.get('x-internal-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await request.json().catch(() => null) as ParallelLegTrackingEvent | null;
  if (!event?.session_id || !event.leg_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  console.log('[PARALLEL-TRACK]', event.event, '| session:', event.session_id, '| leg:', event.leg_id);
  return NextResponse.json({ received: true });
}
