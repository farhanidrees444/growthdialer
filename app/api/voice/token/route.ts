import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { issueVoiceLoginToken } from '@/lib/telnyx/voice-token';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await issueVoiceLoginToken(supabase, authUser.id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.kind === 'jwt') {
      return NextResponse.json({ login_token: result.login_token });
    }

    return NextResponse.json({ login: result.login, password: result.password });
  } catch (error) {
    console.error('[voice/token] error:', error);
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}
