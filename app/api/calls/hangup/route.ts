import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hangupCall } from '@/lib/telnyx';

// SECURITY: This route MUST be authenticated and ownership-checked.
// Without these guards, anyone who learns a call_control_id (visible in
// browser console, the calls table, or webhook logs) could hang up any
// user's live call.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { call_control_id } = body as { call_control_id: string };
    if (!call_control_id) {
      return NextResponse.json({ error: 'Missing call_control_id' }, { status: 400 });
    }

    // Verify the call belongs to this user before hanging up.
    const { data: callRow } = await supabase
      .from('calls')
      .select('id, user_id')
      .eq('telnyx_call_id', call_control_id)
      .maybeSingle();

    if (!callRow) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (callRow.user_id !== user.id) {
      console.warn(`[hangup] user ${user.id} attempted to hang up call ${callRow.id} owned by ${callRow.user_id}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await hangupCall(call_control_id);

    try {
      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('telnyx_call_id', call_control_id)
        .eq('user_id', user.id);
    } catch (dbError) {
      console.error('Failed to update call status on hangup:', dbError);
    }

    return NextResponse.json({ success: true, call_control_id });
  } catch (error) {
    console.error('Hangup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to hang up call' },
      { status: 500 },
    );
  }
}
