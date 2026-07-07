import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { hasPermission } from '@/lib/auth/permissions';

type BulkAction =
  | { type: 'status'; status: string }
  | { type: 'delete' }
  | { type: 'restore' }
  | { type: 'tag_add'; tag: string }
  | { type: 'tag_remove'; tag: string }
  | { type: 'mark_dnc' }
  | { type: 'mark_hot' };

export async function POST(request: NextRequest) {
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

    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const action: BulkAction = body.action;

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Too many leads (max 500)' }, { status: 400 });
    }
    if (!action?.type) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action.type === 'delete' && !hasPermission(access.role, 'DELETE_LEADS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: owned, error: ownErr } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .in('id', ids);

    if (ownErr) return NextResponse.json({ error: 'DB error' }, { status: 500 });
    const ownedIds = (owned ?? []).map((r) => r.id);
    if (ownedIds.length === 0) {
      return NextResponse.json({ error: 'No matching leads found' }, { status: 404 });
    }

    let affected = 0;

    switch (action.type) {
      case 'delete': {
        // Soft delete (requires migration 017)
        const { error } = await supabase
          .from('leads')
          .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
          .eq('user_id', userId)
          .in('id', ownedIds);
        if (error) {
          // Fall back to hard delete if column doesn't exist yet
          const { error: hardErr } = await supabase
            .from('leads')
            .delete()
            .eq('user_id', userId)
            .in('id', ownedIds);
          if (hardErr) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
        }
        affected = ownedIds.length;
        break;
      }

      case 'restore': {
        const { error } = await supabase
          .from('leads')
          .update({ deleted_at: null, deleted_by: null })
          .eq('user_id', userId)
          .in('id', ownedIds);
        if (error) return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
        affected = ownedIds.length;
        break;
      }

      case 'status': {
        const validStatuses = ['new','queued','contacted','connected','callback','meeting_booked','not_interested','do_not_call','wrong_number'];
        if (!action.status || !validStatuses.includes(action.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const { error } = await supabase
          .from('leads')
          .update({ status: action.status, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .in('id', ownedIds);
        if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        affected = ownedIds.length;
        break;
      }

      case 'mark_hot': {
        // Fetch current tags and add 'hot' if not present
        const { data: leads } = await supabase
          .from('leads')
          .select('id, tags')
          .eq('user_id', userId)
          .in('id', ownedIds);

        for (const lead of leads ?? []) {
          const tags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
          if (!tags.includes('hot')) {
            await supabase.from('leads').update({ tags: [...tags, 'hot'], updated_at: new Date().toISOString() }).eq('id', lead.id);
          }
        }
        affected = ownedIds.length;
        break;
      }

      case 'mark_dnc': {
        const { error } = await supabase
          .from('leads')
          .update({ status: 'do_not_call', dnc: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .in('id', ownedIds);
        if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        affected = ownedIds.length;
        break;
      }

      case 'tag_add': {
        if (!action.tag?.trim()) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
        const { data: leads } = await supabase
          .from('leads')
          .select('id, tags')
          .eq('user_id', userId)
          .in('id', ownedIds);

        for (const lead of leads ?? []) {
          const tags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
          if (!tags.includes(action.tag)) {
            await supabase.from('leads').update({ tags: [...tags, action.tag], updated_at: new Date().toISOString() }).eq('id', lead.id);
          }
        }
        affected = ownedIds.length;
        break;
      }

      case 'tag_remove': {
        if (!action.tag?.trim()) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
        const { data: leads } = await supabase
          .from('leads')
          .select('id, tags')
          .eq('user_id', userId)
          .in('id', ownedIds);

        for (const lead of leads ?? []) {
          const tags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
          await supabase.from('leads').update({ tags: tags.filter((t) => t !== action.tag), updated_at: new Date().toISOString() }).eq('id', lead.id);
        }
        affected = ownedIds.length;
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, affected });
  } catch (err) {
    console.error('POST /api/leads/bulk error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
