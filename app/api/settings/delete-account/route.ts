import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { confirm?: string };
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 });
    }

    const service = createServiceClient();
    if (!service) {
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 503 });
    }

    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('[DELETE-ACCOUNT] Failed for user:', user.id, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[DELETE-ACCOUNT] Account deleted:', user.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DELETE-ACCOUNT] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
