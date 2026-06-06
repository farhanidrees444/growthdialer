import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const access = await requireWorkspaceFromRequest(request, supabase, userId, { body });
    if (isWorkspaceError(access)) return access;

    const scope: 'all' | 'selected' | 'filtered' = body.scope ?? 'all';
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const format: 'csv' | 'json' = body.format ?? 'csv';
    const fields: string[] = Array.isArray(body.fields) ? body.fields : ['name','company','phone','email','status','tags'];

    let query = supabase
      .from('leads')
      .select('id,name,first_name,last_name,company,title,phone,email,status,tags,notes,call_attempts,last_called_at,created_at,ai_score,source')
      .eq('workspace_id', access.workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (scope === 'selected' && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { data: leads, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });

    const rows = (leads ?? []).map((l) => {
      const row: Record<string, unknown> = {};
      if (fields.includes('name') || fields.includes('basic')) {
        row.first_name = l.first_name ?? '';
        row.last_name = l.last_name ?? '';
        row.name = l.name ?? '';
      }
      if (fields.includes('company') || fields.includes('basic')) row.company = l.company ?? '';
      if (fields.includes('title')) row.title = l.title ?? '';
      if (fields.includes('phone') || fields.includes('basic')) row.phone = l.phone ?? '';
      if (fields.includes('email') || fields.includes('basic')) row.email = l.email ?? '';
      if (fields.includes('status')) row.status = l.status ?? '';
      if (fields.includes('tags')) row.tags = Array.isArray(l.tags) ? l.tags.join(', ') : '';
      if (fields.includes('notes')) row.notes = l.notes ?? '';
      if (fields.includes('call_history')) {
        row.call_attempts = l.call_attempts ?? 0;
        row.last_called_at = l.last_called_at ?? '';
      }
      if (fields.includes('ai_score')) row.ai_score = l.ai_score ?? '';
      return row;
    });

    if (format === 'json') {
      return NextResponse.json({ data: rows, count: rows.length });
    }

    // Build CSV
    if (rows.length === 0) {
      return new NextResponse('', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads-export.csv"',
        },
      });
    }

    const headers = Object.keys(rows[0]);
    const escapeCell = (val: unknown) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
    ].join('\r\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    console.error('POST /api/leads/export error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
