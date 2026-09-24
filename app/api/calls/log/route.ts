import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { normalizeE164 } from '@/lib/inbound/phone';
import { parseJsonBody, apiUnauthorized } from '@/lib/api/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  from_number: z.string().min(1),
  to_number: z.string().min(1),
  telnyx_call_id: z.string().min(1),
  started_at: z.string().optional(),
});

const updateSchema = z.object({
  telnyx_call_id: z.string().min(1),
  answered_at: z.string().optional(),
  ended_at: z.string().optional(),
  duration_seconds: z.number().int().min(0).optional(),
  status: z.string().max(32).optional(),
});

/**
 * POST /api/calls/log — client-reported inbound call logging.
 *
 * With native inbound (number → SIP connection → browser WebRTC), the server
 * is no longer in the call path, so the browser reports its own inbound
 * calls. Idempotent on telnyx_call_id (unique): ringing retries or double
 * events never create duplicate rows.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return apiUnauthorized();

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, createSchema);
    if (!parsed.ok) return parsed.response;
    const { from_number, to_number, telnyx_call_id, started_at } = parsed.data;

    const nowIso = new Date().toISOString();
    const row = {
      user_id: user.id,
      direction: 'inbound' as const,
      from_number: normalizeE164(from_number) ?? from_number,
      to_number: normalizeE164(to_number) ?? to_number,
      telnyx_call_id,
      status: 'ringing',
      started_at: started_at ?? nowIso,
      created_at: nowIso,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('calls')
      .insert(row)
      .select('id')
      .single();

    if (!insertError && inserted?.id) {
      return NextResponse.json({ db_id: inserted.id });
    }

    // Idempotency: a row for this WebRTC call already exists — return it.
    const { data: existing } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', telnyx_call_id)
      .maybeSingle();

    if (existing?.id) return NextResponse.json({ db_id: existing.id, deduped: true });

    console.error('[calls/log] insert error:', insertError);
    return NextResponse.json({ error: 'Could not log call' }, { status: 500 });
  } catch (error) {
    console.error('[calls/log] error:', error);
    return NextResponse.json({ error: 'Could not log call' }, { status: 500 });
  }
}

/**
 * PATCH /api/calls/log — update a client-reported inbound call
 * (answered / ended / duration). Matched by telnyx_call_id.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return apiUnauthorized();

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, updateSchema);
    if (!parsed.ok) return parsed.response;
    const { telnyx_call_id, answered_at, ended_at, duration_seconds, status } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (answered_at) patch.answered_at = answered_at;
    if (ended_at) patch.ended_at = ended_at;
    if (typeof duration_seconds === 'number') patch.duration_seconds = duration_seconds;
    if (status) {
      patch.status = status;
      if (status === 'no_answer') patch.disposition = 'missed';
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('calls')
      .update(patch)
      .eq('telnyx_call_id', telnyx_call_id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[calls/log] update error:', error);
      return NextResponse.json({ error: 'Could not update call' }, { status: 500 });
    }
    return NextResponse.json({ db_id: data?.id ?? null });
  } catch (error) {
    console.error('[calls/log] error:', error);
    return NextResponse.json({ error: 'Could not update call' }, { status: 500 });
  }
}
