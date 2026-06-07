import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiUnauthorized, parseJsonBody } from '@/lib/api/errors';
import {
  triggerGrowthDialerWebhook,
  validateOutgoingWebhookUrl,
} from '@/lib/webhooks/outgoing';

const saveSchema = z.object({
  webhook_url: z.string(),
  webhook_secret: z.string().max(256).optional().nullable(),
  action: z.literal('save').optional(),
});

const testSchema = z.object({
  action: z.literal('test'),
});

const bodySchema = z.union([saveSchema, testSchema]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const { data, error } = await supabase
    .from('user_settings')
    .select('outgoing_webhook_url, outgoing_webhook_secret')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[webhooks/outgoing] GET failed:', error.message);
    return NextResponse.json({ error: 'Failed to load webhook settings' }, { status: 500 });
  }

  return NextResponse.json({
    webhook_url: data?.outgoing_webhook_url ?? '',
    configured: Boolean(data?.outgoing_webhook_url),
    has_secret: Boolean(data?.outgoing_webhook_secret),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const raw = await req.json().catch(() => null);
  const parsed = parseJsonBody(raw, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.action === 'test') {
    const result = await triggerGrowthDialerWebhook(user.id, 'webhook_test', {
      message: 'GrowthDialer webhook test — your endpoint is reachable.',
      sample: true,
    });

    if (result.skipped) {
      return NextResponse.json(
        { error: 'No webhook URL configured. Save a URL first.' },
        { status: 400 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Test delivery failed', status: result.status },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, message: 'Test event delivered' });
  }

  const urlError = validateOutgoingWebhookUrl(parsed.data.webhook_url);
  if (urlError) {
    return NextResponse.json({ error: urlError }, { status: 400 });
  }

  const secret =
    parsed.data.webhook_secret === null || parsed.data.webhook_secret === undefined
      ? null
      : parsed.data.webhook_secret.trim() || null;

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: user.id,
        outgoing_webhook_url: parsed.data.webhook_url.trim(),
        outgoing_webhook_secret: secret,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[webhooks/outgoing] save failed:', error.message);
    return NextResponse.json({ error: 'Failed to save webhook settings' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, configured: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const { error } = await supabase
    .from('user_settings')
    .update({
      outgoing_webhook_url: null,
      outgoing_webhook_secret: null,
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('[webhooks/outgoing] DELETE failed:', error.message);
    return NextResponse.json({ error: 'Failed to clear webhook' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, configured: false });
}
