import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    const { id } = await params;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Lead fetch failed:', error);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error('Lead fetch error:', error);
    return NextResponse.json({ error: 'Unable to fetch lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const access = await requireWorkspaceFromRequest(request, supabase, userId, { body });
    if (isWorkspaceError(access)) return access;

    const { id } = await params;
    const { data: existingLead } = await supabase
      .from('leads')
      .select('user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const canEditAll = hasPermission(access.role, 'EDIT_ALL_LEADS');
    const canEditOwn = hasPermission(access.role, 'EDIT_OWN_LEADS');
    if (!canEditAll && !(canEditOwn && existingLead.user_id === userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.notes === 'string') updates.notes = body.notes;
    if (typeof body.disposition === 'string') updates.disposition = body.disposition;
    if (typeof body.first_name === 'string') updates.first_name = body.first_name;
    if (typeof body.last_name === 'string') updates.last_name = body.last_name;
    if (typeof body.company === 'string') updates.company = body.company;
    if (typeof body.title === 'string') updates.title = body.title;
    if (typeof body.email === 'string') updates.email = body.email;
    if (typeof body.phone === 'string') updates.phone = body.phone;
    if (typeof body.next_callback_at === 'string') updates.next_callback_at = body.next_callback_at;

    if (updates.first_name || updates.last_name) {
      const { data: nameRow } = await supabase
        .from('leads')
        .select('first_name,last_name')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      const firstName = (updates.first_name as string | undefined) ?? nameRow?.first_name ?? '';
      const lastName = (updates.last_name as string | undefined) ?? nameRow?.last_name ?? '';
      updates.name = `${firstName} ${lastName}`.trim();
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Lead update failed:', error);
      return NextResponse.json({ error: 'Unable to update lead' }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Unable to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireWorkspaceFromRequest(request, supabase, userId);
    if (isWorkspaceError(access)) return access;

    if (!hasPermission(access.role, 'DELETE_LEADS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get('permanent') === '1';

    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, deleted_at')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[LEADS-DELETE] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Unable to verify lead access' }, { status: 500 });
    }

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (permanent) {
      if (!existingLead.deleted_at) {
        return NextResponse.json(
          { error: 'Move this lead to Trash before deleting it forever' },
          { status: 409 },
        );
      }

      const service = createServiceClient();
      if (!service) {
        return NextResponse.json({ error: 'Permanent delete is unavailable' }, { status: 500 });
      }

      const { data, error } = await service
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('[LEADS-DELETE-PERMANENT] Error:', error);
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    const deletedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('leads')
      .update({
        deleted_at: deletedAt,
        deleted_by: userId,
        updated_at: deletedAt,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, deleted_at')
      .maybeSingle();

    if (error) {
      console.error('[LEADS-DELETE] Error:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Lead not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    console.error('[LEADS-DELETE] Exception:', error);
    return NextResponse.json({ error: 'Unable to delete lead' }, { status: 500 });
  }
}
