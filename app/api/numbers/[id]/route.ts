import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: numRecord, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('id, telnyx_number_id, is_default, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !numRecord) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    if (numRecord.status === 'released') {
      return NextResponse.json({ error: 'Number already released' }, { status: 400 });
    }

    if (numRecord.telnyx_number_id) {
      const res = await fetch(
        `https://api.telnyx.com/v2/phone_numbers/${encodeURIComponent(numRecord.telnyx_number_id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
        },
      );
      if (!res.ok && res.status !== 404) {
        console.error('Release failed:', await res.text());
        return NextResponse.json({ error: 'Could not release number' }, { status: 500 });
      }
    }

    await supabase
      .from('purchased_numbers')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        is_default: false,
      })
      .eq('id', id)
      .eq('user_id', userId);

    // Promote another active number to default if this was the default
    if (numRecord.is_default) {
      const { data: next } = await supabase
        .from('purchased_numbers')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();
      if (next) {
        await supabase
          .from('purchased_numbers')
          .update({ is_default: true })
          .eq('id', next.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Release error:', error);
    return NextResponse.json({ error: 'Could not release number' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isDefault } = body as { isDefault: boolean };

    if (isDefault) {
      // Clear current default, then set this one
      await supabase
        .from('purchased_numbers')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { error } = await supabase
        .from('purchased_numbers')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        return NextResponse.json({ error: 'Could not update default number' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set default error:', error);
    return NextResponse.json({ error: 'Could not update default number' }, { status: 500 });
  }
}
