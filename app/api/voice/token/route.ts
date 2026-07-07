import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { getTelephonyProvider } from '@/lib/telephony';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const provider = getTelephonyProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const token = await provider.getWebRTCToken(user.id, user.id);
    return NextResponse.json({
      token: token.loginToken,
      login_token: token.loginToken,
      credential_id: token.credentialId,
      sip_username: token.sipUsername,
      identity: user.id,
    });
  } catch (error) {
    console.error('[voice/token] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not issue credentials' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
