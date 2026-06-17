import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { blockLegacyTelnyxNumberApi } from '@/lib/twilio/telnyx-guard';

export async function POST(request: NextRequest) {
  const blocked = blockLegacyTelnyxNumberApi();
  if (blocked) return blocked;

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

    const params = new URLSearchParams();
    params.set('filter[country_code]', country);
    params.set('filter[phone_number_type]', type === 'toll_free' ? 'toll_free' : 'local');
    params.set('filter[limit]', '12');
    if (areaCode && areaCode.length === 3) {
      params.set('filter[national_destination_code]', areaCode);
    }

    const res = await fetch(
      `https://api.telnyx.com/v2/available_phone_numbers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      console.error('Phone number search failed:', await res.text());
      return NextResponse.json({ error: 'Could not search for phone numbers' }, { status: 500 });
    }

    const data = await res.json();
    const numbers = (data.data ?? []).map((n: Record<string, unknown>) => {
      const regions = (n.region_information as { region_type: string; region_name: string }[]) ?? [];
      const costInfo = (n.cost_information as { monthly_cost?: string; currency?: string }) ?? {};
      return {
        phoneNumber: n.phone_number,
        type: n.phone_number_type,
        city: regions.find((r) => r.region_type === 'city')?.region_name ?? '',
        state: regions.find((r) => r.region_type === 'state')?.region_name ?? '',
        monthlyCost: parseFloat(costInfo.monthly_cost ?? '1.00'),
        currency: costInfo.currency ?? 'USD',
      };
    });

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('Number search error:', error);
    return NextResponse.json({ error: 'Could not search for phone numbers' }, { status: 500 });
  }
}
