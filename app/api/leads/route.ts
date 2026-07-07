import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';
import type { CountryCode } from 'libphonenumber-js';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const access = await requireWorkspaceFromRequest(request, supabase, userId, {
      permission: 'CREATE_LEADS',
      body,
    });
    if (isWorkspaceError(access)) return access;

    const firstName = (body.first_name ?? '').trim();
    const lastName = (body.last_name ?? '').trim();
    const name = `${firstName} ${lastName}`.trim() || body.name?.trim() || 'Unknown Lead';
    const rawPhone: string = (body.phone ?? '').trim();

    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone, (body.country ?? 'US') as CountryCode) ?? rawPhone;

    const { data: existing } = await supabase
      .from('leads')
      .select('id, name')
      .eq('user_id', userId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'duplicate', message: `Phone already exists for lead "${existing.name}"`, existing_id: existing.id },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        user_id: userId,
        name,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone,
        email: body.email?.trim() || undefined,
        company: body.company?.trim() || undefined,
        title: body.title?.trim() || undefined,
        notes: body.notes?.trim() || undefined,
        tags: Array.isArray(body.tags) ? body.tags : [],
        source: 'manual',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Lead create error:', error);
      return NextResponse.json({ error: 'Unable to create lead' }, { status: 500 });
    }

    return NextResponse.json({ lead: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
