import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('provider, is_active, updated_at, workspace_id')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const connected = (creds ?? []).map((c) => ({
    provider: c.provider,
    connected_at: c.updated_at,
  }));

  return NextResponse.json({ connected });
}
