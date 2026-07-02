import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import {
  extractEventType,
  extractMessageId,
  logWebhookEvent,
} from '@/lib/telephony/telnyx/webhook-log';
import { verifyWebhookSignature } from '@/lib/telephony/telnyx/signatures';
import { processSmsWebhookEvent } from '@/lib/telephony/telnyx/sms-webhook-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('telnyx-signature-ed25519')
    ?? request.headers.get('x-telnyx-signature');
  const timestamp = request.headers.get('telnyx-timestamp')
    ?? request.headers.get('x-telnyx-timestamp');

  const verified = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!verified.ok) {
    console.error('[telephony/webhook/sms] signature rejected:', verified.reason);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventType = extractEventType(payload);
  const eventLogId = await logWebhookEvent({
    channel: 'sms',
    eventType,
    payload,
    providerEventId: typeof payload.id === 'string' ? payload.id : null,
    messageId: extractMessageId(payload),
  });

  if (eventLogId) {
    waitUntil(processSmsWebhookEvent(eventLogId, payload));
  }

  return NextResponse.json({ received: true });
}
