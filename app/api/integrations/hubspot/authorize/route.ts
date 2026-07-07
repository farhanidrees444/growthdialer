import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildHubspotAuthorizeUrl } from '@/lib/integrations/hubspot';
import { apiUnauthorized } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const workspaceId = request.nextUrl.searchParams.get('workspace_id');
  const body = workspaceId ? { workspace_id: workspaceId } : {};
  const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
  if (isWorkspaceError(access)) return access;

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    workspaceId: user.id,
  })).toString('base64url');

  const url = buildHubspotAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json(
      { error: 'HubSpot is not configured. Add HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET.' },
      { status: 503 },
    );
  }

  return NextResponse.redirect(url);
}
