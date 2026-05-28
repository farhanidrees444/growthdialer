import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: call } = await supabase
      .from('calls')
      .select('id, recording_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!call.recording_url) return NextResponse.json({ error: 'No recording' }, { status: 400 });

    // Reset so process-call doesn't skip it as already processed
    await supabase
      .from('calls')
      .update({ ai_processed: false, ai_processing_status: 'pending', analytics_id: null })
      .eq('id', id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    void fetch(`${baseUrl}/api/ai/process-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify({ call_id: id }),
    }).catch((err) => console.error('[REPROCESS] Trigger failed:', err));

    return NextResponse.json({ success: true, message: 'Processing started' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
