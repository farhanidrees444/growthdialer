import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone, isE164 } from '@/lib/phone';
import { type CountryCode } from 'libphonenumber-js';

// Admin-only: re-normalizes all leads' phone numbers.
// Protected by requiring the calling user to be the owner of the data.
// Pass ?defaultCountry=GB (or other ISO-2 code) if leads are from a non-US country.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const defaultCountry = (url.searchParams.get('defaultCountry') as CountryCode | null) ?? 'US';

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, phone, status')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: 'Could not load leads' }, { status: 500 });
    }

    let fixed = 0;
    let alreadyValid = 0;
    let failed = 0;

    for (const lead of leads ?? []) {
      if (isE164(lead.phone) && lead.status !== 'invalid_phone') {
        alreadyValid += 1;
        continue;
      }

      const normalized = normalizePhone(lead.phone, defaultCountry);
      if (normalized) {
        await supabase
          .from('leads')
          .update({
            phone: normalized,
            status: lead.status === 'invalid_phone' ? 'queued' : lead.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)
          .eq('user_id', userId);
        fixed += 1;
        console.log(`[normalize-phones] ${lead.phone} → ${normalized}`);
      } else {
        await supabase
          .from('leads')
          .update({ status: 'invalid_phone', updated_at: new Date().toISOString() })
          .eq('id', lead.id)
          .eq('user_id', userId);
        failed += 1;
        console.log(`[normalize-phones] could not normalize: ${lead.phone}`);
      }
    }

    return NextResponse.json({ success: true, fixed, alreadyValid, failed });
  } catch (err) {
    console.error('normalize-phones error:', err);
    return NextResponse.json({ error: 'Normalization failed' }, { status: 500 });
  }
}
