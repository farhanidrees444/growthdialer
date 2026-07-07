import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { validateOutgoingWebhookUrl } from '@/lib/webhooks/outgoing';

const saveSchema = z.object({
  provider: z.string().min(1).max(64),
  api_key: z.string().min(8).max(512).optional(),
  webhook_url: z.string().max(2048).optional(),
});

const API_KEY_PROVIDERS = new Set([
  'vapi',
  'bland',
  'retell',
  'smartlead',
  'instantly',
  'make',
]);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const provider = request.nextUrl.searchParams.get('provider');
  if (!provider) {
    const { data } = await supabase
      .from('integration_credentials')
      .select('provider, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('provider', [...API_KEY_PROVIDERS, 'hubspot']);

    return NextResponse.json({
      connected: (data ?? []).map((r) => r.provider),
    });
  }

  const { data } = await supabase
    .from('integration_credentials')
    .select('provider, metadata, is_active')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .eq('is_active', true)
    .maybeSingle();

  const metadata = (data?.metadata ?? {}) as { webhook_url?: string };

  return NextResponse.json({
    configured: Boolean(data),
    has_key: Boolean(data),
    webhook_url: metadata.webhook_url ?? '',
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const raw = await request.json().catch(() => null);
  const parsed = parseJsonBody(raw, saveSchema);
  if (!parsed.ok) return parsed.response;

  const { provider, api_key, webhook_url } = parsed.data;

  if (!API_KEY_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  if (!api_key && !webhook_url) {
    return NextResponse.json({ error: 'API key or webhook URL required' }, { status: 400 });
  }

  if (webhook_url) {
    const urlError = validateOutgoingWebhookUrl(webhook_url);
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 });
    }
  }

  const { data: existing } = await supabase
    .from('integration_credentials')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .eq('is_active', true)
    .maybeSingle();

  const token = api_key ?? existing?.access_token;
  if (!token) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  const metadata: Record<string, string> = {};
  if (webhook_url) metadata.webhook_url = webhook_url;

  const row = {
    user_id: user.id,
    provider,
    access_token: token,
    is_active: true,
    metadata: Object.keys(metadata).length ? metadata : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('integration_credentials').upsert(row, {
    onConflict: 'user_id,provider',
  });

  if (error) {
    console.error('[integrations/config] save failed:', error.message);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }

  if (webhook_url && provider === 'make') {
    await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        outgoing_webhook_url: webhook_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  return NextResponse.json({ ok: true, provider });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const provider = request.nextUrl.searchParams.get('provider');
  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('integration_credentials')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
