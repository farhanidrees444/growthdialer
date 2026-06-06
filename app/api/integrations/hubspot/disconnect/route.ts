import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  await supabase
    .from('integration_credentials')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('provider', 'hubspot')
    .or(`workspace_id.eq.${access.workspaceId},user_id.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}
