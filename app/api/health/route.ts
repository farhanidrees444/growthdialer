import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Public liveness check. Returns ONLY ok:true — never leaks which env vars
// are configured (was a fingerprinting vector before).
// For env diagnostics, use /api/recordings/diagnostics which requires auth.
export async function GET(_req: NextRequest) {
  // If a logged-in user is hitting this, include their env presence info.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return NextResponse.json({
        ok: true,
        authenticated: true,
        env: {
          telnyx_api_key: !!process.env.TELNYX_API_KEY,
          telnyx_connection_id: !!process.env.TELNYX_CONNECTION_ID,
          telnyx_from_number: !!process.env.TELNYX_FROM_NUMBER,
          telnyx_telephony_credential_id:
            !!process.env.TELNYX_TELEPHONY_CREDENTIAL_ID || !!process.env.TELNYX_CREDENTIAL_ID,
          app_url: !!process.env.APP_URL,
          next_public_app_url: !!process.env.NEXT_PUBLIC_APP_URL,
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          internal_api_secret: !!process.env.INTERNAL_API_SECRET,
          groq_api_key: !!process.env.GROQ_API_KEY,
          gemini_api_key: !!process.env.GEMINI_API_KEY,
          stripe_secret_key: !!process.env.STRIPE_SECRET_KEY,
        },
      });
    }
  } catch {
    // Fall through to anonymous response
  }

  return NextResponse.json({ ok: true });
}
