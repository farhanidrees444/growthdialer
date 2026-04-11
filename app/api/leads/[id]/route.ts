import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).eq('user_id', userId).single();

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const updates: Record<string, any> = {};

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
      const existingLead = await supabase.from('leads').select('first_name,last_name').eq('id', id).eq('user_id', userId).single();
      const firstName = updates.first_name ?? existingLead.data?.first_name ?? '';
      const lastName = updates.last_name ?? existingLead.data?.last_name ?? '';
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
