import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', numbers: [] }, { status: 401 });
    }

    const { data: numbers, error } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number, telnyx_number_id, country, monthly_cost, is_default, status, purchased_at, number_type, billing_status, next_billing_date')
      .eq('user_id', user.id)
      .neq('status', 'released')
      .order('is_default', { ascending: false })
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('[NUMBERS-LIST] DB error:', error);
      return NextResponse.json({ error: error.message, numbers: [] }, { status: 500 });
    }

    console.log('[NUMBERS-LIST]', user.email, 'count:', numbers?.length);
    return NextResponse.json({ numbers: numbers || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NUMBERS-LIST] Crash:', message);
    return NextResponse.json({ error: message, numbers: [] }, { status: 500 });
  }
}
