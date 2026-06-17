import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isPlatformAdminEmail } from '@/lib/auth/platform-admin';
import { assignUserNumber } from '@/lib/twilio/assign-user-number';
import { parseJsonBody } from '@/lib/api/errors';

const assignNumberSchema = z.object({
  email: z.string().email().optional(),
  user_id: z.string().uuid().optional(),
  phone_number: z.string().min(10),
  is_default: z.boolean().optional(),
  country: z.string().length(2).optional(),
  country_name: z.string().optional(),
  number_type: z.string().optional(),
}).refine((v) => Boolean(v.email || v.user_id), {
  message: 'Provide email or user_id',
});

/**
 * POST /api/admin/assign-number
 * Platform admin: assign a voice line to a user (purchased_numbers + Twilio voice app).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id || !isPlatformAdminEmail(authUser.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = parseJsonBody(rawBody, assignNumberSchema);
    if (!parsed.ok) return parsed.response;

    const { email, user_id, phone_number, is_default, country, country_name, number_type } =
      parsed.data;

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    let targetUserId = user_id ?? null;

    if (!targetUserId && email) {
      const { data: listed, error: listError } = await service.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) {
        return NextResponse.json({ error: 'Could not look up user' }, { status: 500 });
      }
      const match = listed.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (!match?.id) {
        return NextResponse.json({ error: 'User not found for that email' }, { status: 404 });
      }
      targetUserId = match.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await assignUserNumber(service, {
      userId: targetUserId,
      phoneNumber: phone_number,
      isDefault: is_default,
      country,
      countryName: country_name,
      numberType: number_type,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/assign-number]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assignment failed' },
      { status: 500 },
    );
  }
}
