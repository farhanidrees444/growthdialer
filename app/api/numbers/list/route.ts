import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number, country, country_code, country_name, number_type, region, locality, monthly_cost, is_default, status, purchased_at')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Numbers list error:', error);
      return NextResponse.json({ error: 'Unable to load numbers' }, { status: 500 });
    }

    return NextResponse.json({ numbers: data ?? [] });
  } catch (error) {
    console.error('Numbers list error:', error);
    return NextResponse.json({ error: 'Unable to load numbers' }, { status: 500 });
  }
}
