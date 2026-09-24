import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubscriptionBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/**
 * Manage the caller's Web Push subscriptions (used to surface inbound calls
 * even when the browser tab is closed).
 *
 * GET    -> list the caller's subscriptions (endpoint + created_at only)
 * POST   -> upsert a subscription { endpoint, keys: { p256dh, auth } }
 * DELETE -> remove a subscription { endpoint }
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data, error } = await service
    .from('push_subscriptions')
    .select('endpoint, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  return NextResponse.json({ subscriptions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SubscriptionBody;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'endpoint and keys.p256dh/auth required' }, { status: 400 });
  }
  if (endpoint.length > 2000 || p256dh.length > 500 || auth.length > 500) {
    return NextResponse.json({ error: 'Subscription too large' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { error } = await service.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' },
  );
  if (error) {
    console.error('[PUSH-API] upsert failed:', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  const endpoint = body.endpoint?.trim();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { error } = await service
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
