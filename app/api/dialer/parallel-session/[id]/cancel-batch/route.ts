import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, apiForbidden } from '@/lib/api/errors';
import { cancelRingingLegs } from '@/lib/parallel-dial/dial-batch';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const { data: session } = await supabase
    .from('parallel_dial_sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!session) return apiForbidden('Session not found');

  await cancelRingingLegs(supabase, id);
  await supabase
    .from('parallel_dial_sessions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}
