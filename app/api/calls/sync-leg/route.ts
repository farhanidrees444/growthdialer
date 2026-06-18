import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { parseJsonBody } from '@/lib/api/errors';
import { linkCallLegs } from '@/lib/twilio/link-call-legs';

const syncLegSchema = z.object({
  call_sid: z.string().min(10),
  parent_call_sid: z.string().optional().nullable(),
  provisional_id: z.string().optional().nullable(),
  db_id: z.string().uuid().optional().nullable(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  from_number: z.string().optional().nullable(),
  to_number: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

/**
 * POST /api/calls/sync-leg
 * Links Twilio CallSids to the calls table (browser leg ↔ PSTN leg).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, syncLegSchema);
    if (!parsed.ok) return parsed.response;

    const {
      call_sid,
      parent_call_sid,
      provisional_id,
      db_id,
      direction,
      from_number,
      to_number,
      lead_id,
    } = parsed.data;

    const { createServiceClient } = await import('@/lib/supabase/service');
    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const result = await linkCallLegs(service, {
      userId: user.id,
      callSid: call_sid,
      parentCallSid: parent_call_sid,
      provisionalId: provisional_id,
      dbId: db_id,
      direction,
      fromNumber: from_number,
      toNumber: to_number,
      leadId: lead_id,
    });

    return NextResponse.json({ ok: true, db_id: result.id });
  } catch (error) {
    console.error('[calls/sync-leg]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
