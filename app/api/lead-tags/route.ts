import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('lead_tags')
      .select('id, name, color, created_at')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      // Table doesn't exist yet (migration not run) — return empty
      if (error.code === '42P01') return NextResponse.json({ tags: [] });
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    console.error('GET /api/lead-tags error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name ?? '').trim();
    const color = (body.color ?? '#6366f1').trim();

    if (!name) return NextResponse.json({ error: 'Tag name required' }, { status: 400 });
    if (name.length > 40) return NextResponse.json({ error: 'Tag name too long (max 40)' }, { status: 400 });

    const { data, error } = await supabase
      .from('lead_tags')
      .insert({ user_id: userId, name, color })
      .select('id, name, color, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
      }
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Tags migration not yet applied' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json({ tag: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/lead-tags error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
