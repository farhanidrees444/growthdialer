import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    telnyx_api_key: !!process.env.TELNYX_API_KEY,
    telnyx_connection_id: !!process.env.TELNYX_CONNECTION_ID,
    telnyx_from_number: !!process.env.TELNYX_FROM_NUMBER,
    app_url: !!process.env.APP_URL,
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
