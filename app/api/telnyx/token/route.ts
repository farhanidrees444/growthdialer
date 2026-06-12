import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { issueUserWebRtcToken } from '@/lib/telnyx/webrtc-token-engine';

/**
 * POST /api/telnyx/token
 * Issues a short-lived On-Demand WebRTC JWT for the authenticated user.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await issueUserWebRtcToken(supabase, authUser.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail },
        { status: result.status },
      );
    }

    return NextResponse.json({
      login_token: result.login_token,
      credential_id: result.credential_id,
      sip_username: result.sip_username,
    });
  } catch (error) {
    console.error('[telnyx/token] error:', error);
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}
