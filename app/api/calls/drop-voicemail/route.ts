import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

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

    const access = await requireWorkspaceFromRequest(req, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'MAKE_CALLS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const callRow = await requireCallAccess(
      supabase,
      { telnyxCallId: call_control_id },
      access,
      user.id,
      'control',
    );
    if (isCallAccessError(callRow)) return callRow;

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
      return NextResponse.json({ error: 'Failed to start playback' }, { status: 502 });
    }

    void supabase
      .from('voicemails')
      .update({ drop_count: (vm.drop_count ?? 0) + 1 })
      .eq('id', vm.id);

    const resolvedDbId = call_db_id ?? callRow.id;
    void supabase
      .from('calls')
      .update({ disposition: 'voicemail', updated_at: new Date().toISOString() })
      .eq('id', resolvedDbId);

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
