import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeHubspotCode } from '@/lib/integrations/hubspot';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateRaw = request.nextUrl.searchParams.get('state');
  const appBase = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${appBase}/integrations?error=hubspot_denied`);
  }

  let state: { userId: string; workspaceId: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()) as typeof state;
  } catch {
    return NextResponse.redirect(`${appBase}/integrations?error=hubspot_state`);
  }

  const tokens = await exchangeHubspotCode(code);
  if (!tokens) {
    return NextResponse.redirect(`${appBase}/integrations?error=hubspot_token`);
  }

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from('integration_credentials').upsert({
    user_id: state.userId,
    workspace_id: state.workspaceId,
    provider: 'hubspot',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });

  return NextResponse.redirect(`${appBase}/integrations?connected=hubspot`);
}
