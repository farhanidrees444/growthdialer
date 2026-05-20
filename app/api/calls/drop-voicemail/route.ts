import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      callId: string;
      voicemailId: string;
      telnyxCallControlId: string;
    };

    const { callId, voicemailId, telnyxCallControlId } = body;
    if (!callId || !voicemailId || !telnyxCallControlId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch voicemail, verify it belongs to this user
    const { data: vm, error: vmErr } = await supabase
      .from('voicemails')
      .select('id, audio_url, duration_seconds, name')
      .eq('id', voicemailId)
      .eq('user_id', user.id)
      .single();

    if (vmErr || !vm) {
      return NextResponse.json({ error: 'Voicemail not found' }, { status: 404 });
    }

    // Trigger Telnyx playback
    const telnyxRes = await fetch(
      `https://api.telnyx.com/v2/calls/${telnyxCallControlId}/actions/playback_start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
        body: JSON.stringify({
          audio_url: vm.audio_url,
          overlay: false,
          loop: false,
          client_state: btoa(JSON.stringify({ callId, voicemailId })),
        }),
      },
    );

    if (!telnyxRes.ok) {
      const errBody = await telnyxRes.text();
      console.error('[VM DROP] Telnyx error:', telnyxRes.status, errBody);
      return NextResponse.json(
        { error: `Telnyx error: ${telnyxRes.status}` },
        { status: 502 },
      );
    }

    // Increment drop count (non-critical)
    const currentDropCount = (vm as { drop_count?: number }).drop_count ?? 0;
    void supabase
      .from('voicemails')
      .update({ drop_count: currentDropCount + 1 })
      .eq('id', voicemailId)
      .eq('user_id', user.id);

    // Update call disposition
    await supabase
      .from('calls')
      .update({ disposition: 'voicemail_dropped' })
      .eq('id', callId)
      .eq('user_id', user.id);

    return NextResponse.json({
      ok: true,
      duration_seconds: vm.duration_seconds,
      voicemail_name: vm.name,
    });
  } catch (err) {
    console.error('[VM DROP] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
