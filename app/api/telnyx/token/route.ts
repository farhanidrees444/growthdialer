import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { issueUserWebRtcToken } from '@/lib/telnyx/webrtc-token-engine';
import { prepareVoiceAccount } from '@/lib/voice/prepare-voice-account';
import { voiceLog } from '@/lib/voice/structured-log';

/**
 * POST /api/telnyx/token
 * Issues a short-lived On-Demand WebRTC JWT for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result = await issueUserWebRtcToken(supabase, authUser.id);
    if (!result.ok && result.status === 503) {
      voiceLog.warn(
        { service: 'telnyx-token', user_id: authUser.id, event: 'prepare_retry' },
        'Token unavailable — running voice account repair',
      );
      await prepareVoiceAccount(supabase, authUser.id, authUser.email ?? '');
      result = await issueUserWebRtcToken(supabase, authUser.id);
    }
    if (!result.ok) {
      voiceLog.error(
        {
          service: 'telnyx-token',
          user_id: authUser.id,
          duration_ms: Date.now() - started,
          error: result.error,
        },
        'WebRTC token issuance failed',
      );
      return NextResponse.json(
        { error: result.error, detail: result.detail },
        { status: result.status },
      );
    }

    voiceLog.info(
      {
        service: 'telnyx-token',
        user_id: authUser.id,
        credential_id: result.credential_id,
        sip_username: result.sip_username,
        duration_ms: Date.now() - started,
      },
      'WebRTC token issued',
    );

    return NextResponse.json({
      login_token: result.login_token,
      credential_id: result.credential_id,
      sip_username: result.sip_username,
      user_id: authUser.id,
      client_identity: result.sip_username ?? result.credential_id,
    });
  } catch (error) {
    voiceLog.error(
      {
        service: 'telnyx-token',
        duration_ms: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      },
      'Token route exception',
    );
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}

