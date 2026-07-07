import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findActiveInboundRingForUser } from '@/lib/inbound/active-ring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const call = await findActiveInboundRingForUser(supabase, user.id);

  return NextResponse.json({ call: call ?? null });
}
