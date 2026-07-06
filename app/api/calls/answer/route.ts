import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  findInboundCallBySession,
  markInboundAccepted,
} from '@/lib/telephony/telnyx/inbound-router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    telnyx_session_id?: string;
    call_id?: string;
  };

  const telnyxSessionId = body.telnyx_session_id?.trim();
  if (!telnyxSessionId) {
    return NextResponse.json({ error: 'telnyx_session_id required' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const call = await findInboundCallBySession(service, telnyxSessionId);
  if (!call) {
    return NextResponse.json({ error: 'Inbound call not found' }, { status: 404 });
  }

  if (call.user_id && call.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (call.status !== 'ringing') {
    return NextResponse.json({ ok: true, status: call.status });
  }

  await markInboundAccepted(service, telnyxSessionId, user.id);
  console.log('[INBOUND-ANSWERED]', telnyxSessionId);
  return NextResponse.json({
    ok: true,
    status: 'answered',
    call_id: call.id,
    telnyx_call_id: call.telnyx_call_id,
  });
}
