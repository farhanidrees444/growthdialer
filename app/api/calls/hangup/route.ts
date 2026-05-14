import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hangupCall } from '@/lib/telnyx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { call_control_id } = body as { call_control_id: string };

    if (!call_control_id) {
      return NextResponse.json({ error: 'Missing call_control_id' }, { status: 400 });
    }

    await hangupCall(call_control_id);

    try {
      const supabase = await createClient();
      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('telnyx_call_id', call_control_id);
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
