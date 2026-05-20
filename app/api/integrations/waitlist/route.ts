import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { email, provider } = await req.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (!provider || typeof provider !== 'string') {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('integration_waitlist')
    .upsert(
      { email: email.toLowerCase().trim(), provider, user_id: user?.id ?? null },
      { onConflict: 'email,provider', ignoreDuplicates: true }
    );

  if (error) {
    console.error('[waitlist] insert error:', error.message);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
