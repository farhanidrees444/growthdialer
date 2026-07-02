import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { advanceInboundRingGroup } from '@/lib/telephony/telnyx/inbound-router';
import {
  assertAgentMayActOnInbound,
  resolveInboundCallForAgent,
} from '@/lib/telephony/telnyx/resolve-inbound-for-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    inbound_call_id?: string;
    provider_call_id?: string;
    from_number?: string;
    to_number?: string;
  };

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const inbound = await resolveInboundCallForAgent(service, user.id, body);
  if (!inbound) {
    return NextResponse.json({ error: 'Inbound call not found' }, { status: 404 });
  }

  if (!assertAgentMayActOnInbound(inbound, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await advanceInboundRingGroup(service, inbound.id, 'agent_declined');
  return NextResponse.json({ ok: result.ok, status: result.status });
}
