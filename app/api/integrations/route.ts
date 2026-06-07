import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { validateOutgoingWebhookUrl } from '@/lib/webhooks/outgoing';
import { triggerGrowthDialerWebhook } from '@/lib/webhooks/outgoing';

const API_KEY_PROVIDERS = new Set([
  'vapi',
  'bland',
  'retell',
  'smartlead',
  'instantly',
  'make',
]);

const saveSchema = z.object({
  provider: z.string().min(1).max(64).optional(),
  api_key: z.string().min(8).max(512).optional(),
  webhook_url: z.string().max(2048).optional(),
  webhook_secret: z.string().max(256).optional().nullable(),
  action: z.enum(['save', 'test']).optional(),
});

/** Unified integrations bridge — status, config, and Zapier/outgoing webhooks */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const access = await requireWorkspaceFromRequest(request, supabase, user.id);
  if (isWorkspaceError(access)) return access;

  const provider = request.nextUrl.searchParams.get('provider');

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('provider, is_active, updated_at, workspace_id, metadata')
    .or(`workspace_id.eq.${access.workspaceId},user_id.eq.${user.id}`)
    .eq('is_active', true);

  const { data: settings } = await supabase
    .from('user_settings')
    .select('outgoing_webhook_url, outgoing_webhook_secret')
    .eq('user_id', user.id)
    .maybeSingle();

  const webhookConfigured = Boolean(settings?.outgoing_webhook_url);
  const connectedProviders = (creds ?? []).map((c) => c.provider);
  if (webhookConfigured && !connectedProviders.includes('zapier')) {
    connectedProviders.push('zapier', 'webhooks');
  }

  if (provider) {
    const row = (creds ?? []).find((c) => c.provider === provider);
    const metadata = (row?.metadata ?? {}) as { webhook_url?: string };
    return NextResponse.json({
      configured: Boolean(row),
      has_key: Boolean(row),
      webhook_url: metadata.webhook_url ?? settings?.outgoing_webhook_url ?? '',
      has_secret: Boolean(settings?.outgoing_webhook_secret),
    });
  }

  return NextResponse.json({
    connected: (creds ?? []).map((c) => ({
      provider: c.provider,
      connected_at: c.updated_at,
    })),
    connectedProviders: [...new Set(connectedProviders)],
    webhookConfigured,
    webhook_url: settings?.outgoing_webhook_url ?? '',
    has_secret: Boolean(settings?.outgoing_webhook_secret),
    events: ['call_completed', 'call_started', 'disposition_set', 'meeting_booked'],
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

  const { provider, api_key, webhook_url, webhook_secret, action } = parsed.data;

  if (action === 'test') {
    const result = await triggerGrowthDialerWebhook(user.id, 'webhook_test', {
      message: 'GrowthDialer webhook test — your endpoint is reachable.',
      sample: true,
    });
    if (result.skipped) {
      return NextResponse.json({ error: 'No webhook URL configured. Save a URL first.' }, { status: 400 });
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Test delivery failed', status: result.status },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, message: 'Test event delivered' });
  }

  // Outgoing webhook (Zapier / Custom Webhooks)
  if (webhook_url && (!provider || provider === 'zapier' || provider === 'webhooks')) {
    const urlError = validateOutgoingWebhookUrl(webhook_url);
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 });
    }

    const secret =
      webhook_secret === null || webhook_secret === undefined
        ? null
        : webhook_secret.trim() || null;

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        outgoing_webhook_url: webhook_url.trim(),
        outgoing_webhook_secret: secret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      return NextResponse.json({ error: 'Failed to save webhook settings' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, configured: true, provider: provider ?? 'webhooks' });
  }

  if (!provider || !API_KEY_PROVIDERS.has(provider)) {
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

  const { error } = await supabase.from('integration_credentials').upsert(
    {
      user_id: user.id,
      workspace_id: access.workspaceId,
      provider,
      access_token: token,
      is_active: true,
      metadata: Object.keys(metadata).length ? metadata : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  );

  if (error) {
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
  const clearWebhook = request.nextUrl.searchParams.get('webhook') === '1';

  if (clearWebhook) {
    await supabase
      .from('user_settings')
      .update({ outgoing_webhook_url: null, outgoing_webhook_secret: null })
      .eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 });
  }

  await supabase
    .from('integration_credentials')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('provider', provider);

  return NextResponse.json({ ok: true });
}
