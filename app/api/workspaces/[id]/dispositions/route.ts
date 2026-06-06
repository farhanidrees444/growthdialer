import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { getWorkspaceDispositions } from '@/lib/dispositions/workspace';
import { z } from 'zod';

const createSchema = z.object({
  key: z.string().min(1).max(40).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(60),
  emoji: z.string().max(4).optional(),
  category: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  lead_status: z.string().min(1).max(40),
  sort_order: z.number().int().min(0).max(99).optional(),
  hotkey: z.number().int().min(1).max(9).nullable().optional(),
  triggers_callback: z.boolean().optional(),
  triggers_meeting: z.boolean().optional(),
  sets_dnc: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dispositions = await getWorkspaceDispositions(supabase, id);
  return NextResponse.json({ dispositions });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!member || !hasPermission(member.role as Role, 'MANAGE_TEAMS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('workspace_dispositions')
    .insert({
      workspace_id: id,
      ...body,
      sort_order: body.sort_order ?? 50,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ disposition: data });
}
