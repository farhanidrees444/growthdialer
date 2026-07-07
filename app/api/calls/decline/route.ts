import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  findInboundCallBySession,
  markInboundDeclined,
} from '@/lib/telephony/telnyx/inbound-router';

import { findPurchasedNumberOwner } from '@/lib/inbound/lookup-number';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function userMayControlInboundCall(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  call: { user_id: string | null; to_number: string | null },
): Promise<boolean> {
  if (!call.user_id || call.user_id === userId) return true;
  if (!call.to_number) return false;
  const owned = await findPurchasedNumberOwner(supabase, call.to_number);
  return owned?.user_id === userId;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    telnyx_session_id?: string;
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

  if (!(await userMayControlInboundCall(supabase, user.id, call))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (call.user_id !== user.id) {
    await service
      .from('calls')
      .update({ user_id: user.id })
      .eq('id', call.id);
  }

  if (call.status !== 'ringing') {
    return NextResponse.json({ ok: true, status: call.status });
  }

  await markInboundDeclined(service, telnyxSessionId);
  console.log('[INBOUND-DECLINED]', telnyxSessionId);
  return NextResponse.json({ ok: true, status: 'missed' });
}
