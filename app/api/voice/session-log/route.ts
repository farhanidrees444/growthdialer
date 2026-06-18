import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { voiceSessionLogWithClient } from '@/lib/voice/session-log';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    event?: string;
    payload?: Record<string, unknown>;
    call_sid?: string | null;
  };

  if (!body.event?.trim()) {
    return NextResponse.json({ error: 'event required' }, { status: 400 });
  }

  await voiceSessionLogWithClient(supabase, {
    userId: user.id,
    callSid: body.call_sid ?? null,
    event: body.event,
    payload: body.payload ?? {},
  });

  return NextResponse.json({ ok: true });
}
