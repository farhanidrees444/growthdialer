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

    // Fetch the number to get the Telnyx ID + spam_score
    const { data: num, error: fetchErr } = await supabase
      .from('purchased_numbers')
      .select('id, spam_score, phone_number')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !num) return NextResponse.json({ error: 'Number not found' }, { status: 404 });

    // Derive spam_status from existing spam_score (0-100, higher = more spam)
    const score = num.spam_score ?? 0;
    let spam_status = 'clean';
    if (score >= 80) spam_status = 'blocked';
    else if (score >= 50) spam_status = 'flagged';
    else if (score >= 20) spam_status = 'low_risk';

    const { error } = await supabase
      .from('purchased_numbers')
      .update({ spam_status, last_spam_check: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, spam_status, spam_score: score });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
