import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CallControlAction = 'pause_recording' | 'resume_recording' | 'mute' | 'hold' | 'unhold' | 'unmute';

interface CallControlBody {
  call_control_id: string;
  action: CallControlAction;
}

const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

export async function POST(request: NextRequest) {
  let body: CallControlBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { call_control_id, action } = body;
  if (!call_control_id || !action) {
    return NextResponse.json({ error: 'call_control_id and action required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: callRow } = await supabase
    .from('calls')
    .select('id, user_id, was_recorded')
    .eq('telnyx_call_id', call_control_id)
    .eq('user_id', user.id)
    .single();

  if (!callRow) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const telnyxApiKey = process.env.TELNYX_API_KEY;
  if (!telnyxApiKey) {
    return NextResponse.json({ error: 'Telnyx API key not configured' }, { status: 503 });
  }

  // Map action to Telnyx endpoint
  const actionMap: Record<CallControlAction, string> = {
    pause_recording: `calls/${call_control_id}/actions/record_pause`,
    resume_recording: `calls/${call_control_id}/actions/record_resume`,
    mute: `calls/${call_control_id}/actions/mute`,
    unmute: `calls/${call_control_id}/actions/unmute`,
    hold: `calls/${call_control_id}/actions/hold`,
    unhold: `calls/${call_control_id}/actions/unhold`,
  };

  const endpoint = actionMap[action];
  if (!endpoint) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  try {
    console.log(`[call-control] ${action} → ${endpoint}`);
    const telnyxRes = await fetch(`${TELNYX_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${telnyxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!telnyxRes.ok) {
      const errText = await telnyxRes.text();
      console.error(`[call-control] Telnyx error ${telnyxRes.status}:`, errText);
      return NextResponse.json({ error: `Telnyx API error: ${telnyxRes.status}` }, { status: 502 });
    }

    // Update was_recorded flag in DB
    if (action === 'pause_recording') {
      await supabase.from('calls').update({ was_recorded: false }).eq('id', callRow.id);
    } else if (action === 'resume_recording') {
      await supabase.from('calls').update({ was_recorded: true }).eq('id', callRow.id);
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error('[call-control] fetch error:', err);
    return NextResponse.json({ error: 'Network error' }, { status: 502 });
  }
}
