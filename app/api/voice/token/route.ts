import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Preferred: short-lived JWT via Telnyx telephony credential
    const credentialId = process.env.TELNYX_CREDENTIAL_ID;
    if (credentialId) {
      const res = await fetch(
        `https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      if (res.ok) {
        const body = await res.json();
        const token = body.token ?? body.data?.token;
        if (token) {
          return NextResponse.json({ login_token: token });
        }
      } else {
        console.error('[voice/token] credential token fetch failed:', res.status, await res.text().catch(() => ''));
      }
    }

    // Fallback: return SIP credentials directly
    const login = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME;
    const password = process.env.TELNYX_SIP_PASSWORD;
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Voice credentials not configured' },
        { status: 503 },
      );
    }
    return NextResponse.json({ login, password });
  } catch (error) {
    console.error('[voice/token] error:', error);
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}
