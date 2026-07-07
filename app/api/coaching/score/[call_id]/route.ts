import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ call_id: string }> };

async function getCallAccess(request: NextRequest, callId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return { response: access };

  const { data: call } = await supabase
    .from('calls')
    .select('id, user_id, workspace_id')
    .eq('id', callId)
    .maybeSingle();
  if (!call) return { response: NextResponse.json({ error: 'Call not found' }, { status: 404 }) };
  if (call.user_id !== user.id && !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase, user, access, call };
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const { call_id: callId } = await params;
  const ctx = await getCallAccess(request, callId);
  if ('response' in ctx) return ctx.response;

  const { data: score, error } = await ctx.supabase
    .from('call_scores')
    .select('*')
    .eq('call_id', callId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ score: score ?? null });
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { call_id: callId } = await params;
  const ctx = await getCallAccess(request, callId);
  if ('response' in ctx) return ctx.response;
  if (!hasPermission(ctx.access.role, 'VIEW_ALL_RECORDINGS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = createServiceClient();
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!service || !secret) return NextResponse.json({ error: 'Scoring service unavailable' }, { status: 503 });

  const { data, error } = await service.functions.invoke('score_call', {
    body: { call_id: callId },
    headers: { 'x-internal-secret': secret },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { ok: true });
}
