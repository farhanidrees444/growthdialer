import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import { searchTwilioAvailableNumbers } from '@/lib/twilio/number-inventory';

export async function POST(request: NextRequest) {
  if (!isTwilioVoiceConfigured()) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { country = 'US', areaCode, type = 'local' } = body as {
      country?: string;
      areaCode?: string;
      type?: string;
    };

    const numbers = await searchTwilioAvailableNumbers({
      country,
      areaCode,
      type,
      limit: 12,
    });

    if (numbers.length === 0) {
      return NextResponse.json(
        { error: 'No numbers available for that search. Try a different area code.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('[NUMBERS-SEARCH]', error);
    return NextResponse.json({ error: 'Could not search for phone numbers' }, { status: 500 });
  }
}
