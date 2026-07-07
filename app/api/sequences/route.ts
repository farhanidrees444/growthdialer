import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { apiUnauthorized } from '@/lib/api/errors';
import { normalizeSequenceName, sequenceNameError } from '@/lib/sequences/cleanup';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    step_type: z.enum(['call', 'wait']),
    wait_days: z.number().int().min(0).max(30).default(1),
  })).min(1).max(20),
  workspace_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const userId = user.id;
  const { data: sequences, error } = await supabase
    .from('sequences')
    .select('*, sequence_steps(*)')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = (sequences ?? []).map((s) => ({
    ...s,
    sequence_steps: (s.sequence_steps as { step_order: number }[] | null)
      ?.sort((a, b) => a.step_order - b.step_order) ?? [],
  }));

  return NextResponse.json({ sequences: normalized });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const raw = await request.json();
  const parsed = createSchema.parse(raw);
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body: raw });
  if (isWorkspaceError(access)) return access;

  const name = normalizeSequenceName(parsed.name);
  const nameErr = sequenceNameError(name);
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

  const { data: seq, error } = await supabase
    .from('sequences')
    .insert({
      name,
      description: parsed.description ?? null,
      created_by: user.id,
      user_id: user.id,
      status: 'active',
    })
    .select('*')
    .single();

  if (error || !seq) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }

  const steps = parsed.steps.map((step, i) => ({
    sequence_id: seq.id,
    step_order: i + 1,
    step_type: step.step_type,
    wait_days: step.wait_days,
  }));

  await supabase.from('sequence_steps').insert(steps);

  const { data: full } = await supabase
    .from('sequences')
    .select('*, sequence_steps(*)')
    .eq('id', seq.id)
    .single();

  return NextResponse.json({ sequence: full });
}
