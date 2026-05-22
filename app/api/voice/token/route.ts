import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.TELNYX_API_KEY;
    const credentialId = process.env.TELNYX_CREDENTIAL_ID;
    
    // Method 1: Use telephony credential for short-lived JWT (preferred)
    if (credentialId && apiKey) {
      console.log('[voice/token] Attempting credential-based token...');
      const res = await fetch(
        `https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      if (res.ok) {
        const body = await res.json();
        const token = body.token ?? body.data?.token;
        if (token) {
          console.log('[voice/token] Credential token issued successfully');
          return NextResponse.json({ login_token: token });
        }
      } else {
        const errorText = await res.text().catch(() => '');
        console.error('[voice/token] Credential token fetch failed:', res.status, errorText);
      }
    }

    // Method 2: Use SIP credentials for direct login
    const login = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME;
    const password = process.env.TELNYX_SIP_PASSWORD;
    
    if (login && password) {
      console.log('[voice/token] Using SIP credentials fallback');
      return NextResponse.json({ login, password });
    }

    // No credentials available
    console.error('[voice/token] No voice credentials configured');
    console.error('[voice/token] Required env vars: TELNYX_CREDENTIAL_ID + TELNYX_API_KEY, or NEXT_PUBLIC_TELNYX_SIP_USERNAME + TELNYX_SIP_PASSWORD');
    
    return NextResponse.json(
      { 
        error: 'Voice credentials not configured',
        details: 'Please set TELNYX_CREDENTIAL_ID in your environment variables for WebRTC calling'
      },
      { status: 503 },
    );
  } catch (error) {
    console.error('[voice/token] Unexpected error:', error);
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}
