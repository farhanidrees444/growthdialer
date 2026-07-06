import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import {
  extractCallControlId,
  extractEventType,
  logWebhookEvent,
} from '@/lib/telephony/telnyx/webhook-log';
import { verifyWebhookSignature } from '@/lib/telephony/telnyx/signatures';
import { processVoiceWebhookEvent } from '@/lib/telephony/telnyx/voice-webhook-processor';
import {
  isBridgeLegClientState,
  sendTelnyxAnswerFast,
  skippedAnswerResult,
  type FastAnswerResult,
} from '@/lib/telnyx/fast-answer';
import { isExplicitOutboundTelnyxPayload } from '@/lib/telephony/telnyx/payload-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readClientState(payload: Record<string, unknown>): string | undefined {
  const data = payload.data as Record<string, unknown> | undefined;
  const inner = (data?.payload as Record<string, unknown> | undefined) ?? {};
  return typeof inner.client_state === 'string' ? inner.client_state : undefined;
}

export async function POST(request: NextRequest) {
  const handlerStartMs = Date.now();
  const rawBody = await request.text();
  const signature = request.headers.get('telnyx-signature-ed25519')
    ?? request.headers.get('x-telnyx-signature');
  const timestamp = request.headers.get('telnyx-timestamp')
    ?? request.headers.get('x-telnyx-timestamp');

  const verified = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!verified.ok) {
    console.error('[telephony/webhook/voice] signature rejected:', verified.reason);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventType = extractEventType(payload);
  const callControlId = extractCallControlId(payload);
  let answerMeta: FastAnswerResult | null = null;

  console.log('[INBOUND-WEBHOOK-RECEIVED]', eventType, callControlId ?? 'no-control-id');

  if (eventType === 'call.initiated' && callControlId) {
    if (isBridgeLegClientState(readClientState(payload))) {
      answerMeta = skippedAnswerResult('bridge_leg');
    } else if (isExplicitOutboundTelnyxPayload(payload)) {
      answerMeta = await sendTelnyxAnswerFast(callControlId);
      console.log(
        `[telephony/webhook/voice] ANSWER_SENT +${Date.now() - handlerStartMs}ms ok=${answerMeta.ok}`,
      );
    } else {
      answerMeta = skippedAnswerResult('inbound_no_auto_answer');
      console.log('[INBOUND-AUTO-ANSWER-BLOCKED]', {
        call_control_id: callControlId,
        direction: payload.data ? (payload.data as Record<string, unknown>).payload : null,
      });
    }
  }

  const eventLogId = await logWebhookEvent({
    channel: 'voice',
    eventType,
    payload,
    providerEventId: typeof payload.id === 'string' ? payload.id : null,
    callControlId,
  });

  if (eventLogId) {
    waitUntil(processVoiceWebhookEvent(eventLogId, payload, answerMeta));
  }

  return NextResponse.json({ received: true });
}
