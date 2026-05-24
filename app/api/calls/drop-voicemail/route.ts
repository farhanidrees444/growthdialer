import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      call_control_id: string;
      call_db_id?: string;
      voicemail_id?: string;
    };
    const { call_control_id, call_db_id, voicemail_id } = body;

    if (!call_control_id) {
      return NextResponse.json({ error: 'Missing call_control_id' }, { status: 400 });
    }

    // Get voicemail to play — use specified one or fall back to first in user's library
    let vmQuery = supabase
      .from('voicemails')
      .select('id, audio_url, duration_seconds, name, drop_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (voicemail_id) {
      vmQuery = supabase
        .from('voicemails')
        .select('id, audio_url, duration_seconds, name, drop_count')
        .eq('id', voicemail_id)
        .eq('user_id', user.id)
        .limit(1);
    }

    const { data: vms } = await vmQuery;
    const vm = vms?.[0];

    if (!vm) {
      return NextResponse.json({ error: 'No voicemail found — upload one in Settings → Voicemails' }, { status: 404 });
    }

    // Trigger Telnyx playback on the live call
    const telnyxRes = await fetch(
      `https://api.telnyx.com/v2/calls/${call_control_id}/actions/playback_start`,
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
        }),
      },
    );

    if (!telnyxRes.ok) {
      const errBody = await telnyxRes.text();
      console.error('[VM DROP] Telnyx error:', telnyxRes.status, errBody);
      return NextResponse.json({ error: `Failed to start playback` }, { status: 502 });
    }

    // Increment drop count (fire-and-forget)
    void supabase
      .from('voicemails')
      .update({ drop_count: (vm.drop_count ?? 0) + 1 })
      .eq('id', vm.id);

    // Mark call disposition on the DB record if available
    if (call_db_id) {
      void supabase
        .from('calls')
        .update({ disposition: 'voicemail', updated_at: new Date().toISOString() })
        .eq('id', call_db_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      ok: true,
      duration_seconds: vm.duration_seconds ?? 0,
      voicemail_name: vm.name,
    });
  } catch (err) {
    console.error('[VM DROP] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
