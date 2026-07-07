import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import {
  getPhoneNumberSettings,
  upsertPhoneNumberSettings,
} from '@/lib/voice/phone-number-settings';
import { invalidateNumberOwnerCache } from '@/lib/inbound/number-owner-cache';

const INBOUND_MODES = new Set(['browser', 'forward', 'voicemail', 'off', null]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    const { data: number } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number, user_id, workspace_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .neq('status', 'released')
      .maybeSingle();

    if (!number) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    const settings = await getPhoneNumberSettings(supabase, id);

    return NextResponse.json({
      purchased_number_id: id,
      phone_number: number.phone_number,
      settings: settings ?? {
        recording_enabled: true,
        inbound_mode: null,
        inbound_forward_number: null,
        inbound_ring_seconds: null,
        cnam_presentation: null,
      },
    });
  } catch (err) {
    console.error('[numbers/settings] GET error:', err);
    return NextResponse.json({ error: 'Could not load settings' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const access = await requireWorkspaceFromRequest(request, supabase, user.id, { body });
    if (isWorkspaceError(access)) return access;

    const { data: number } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number, user_id, workspace_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .neq('status', 'released')
      .maybeSingle();

    if (!number) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.recording_enabled === 'boolean') {
      patch.recording_enabled = body.recording_enabled;
    }
    if ('inbound_mode' in body) {
      const mode = body.inbound_mode as string | null;
      if (!INBOUND_MODES.has(mode)) {
        return NextResponse.json({ error: 'Invalid inbound_mode' }, { status: 400 });
      }
      patch.inbound_mode = mode;
    }
    if ('inbound_forward_number' in body) {
      patch.inbound_forward_number = body.inbound_forward_number ?? null;
    }
    if ('inbound_ring_seconds' in body) {
      const secs = Number(body.inbound_ring_seconds);
      patch.inbound_ring_seconds = Number.isFinite(secs) ? Math.min(120, Math.max(10, secs)) : null;
    }
    if ('cnam_presentation' in body) {
      const cnam = typeof body.cnam_presentation === 'string'
        ? body.cnam_presentation.trim().slice(0, 15)
        : null;
      patch.cnam_presentation = cnam || null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const settings = await upsertPhoneNumberSettings(supabase, {
      purchasedNumberId: id,
      userId: user.id,
      patch,
    });

    invalidateNumberOwnerCache(number.phone_number as string);

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[numbers/settings] PATCH error:', err);
    return NextResponse.json({ error: 'Could not save settings' }, { status: 500 });
  }
}
