import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { verifyTelnyxSignature } from '@/lib/telnyx-signature';
import {
  isBridgeLegClientState,
  sendTelnyxAnswerFast,
  skippedAnswerResult,
  type FastAnswerResult,
} from '@/lib/telnyx/fast-answer';

interface TelnyxWebhookBody {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      call_control_id?: string;
      client_state?: string;
      [key: string]: unknown;
    };
  };
  meta?: Record<string, unknown>;
}

function scheduleWebhookBackground(
  body: TelnyxWebhookBody,
  receivedAt: string,
  answerMeta: FastAnswerResult | null,
): void {
  waitUntil(
    import('./process-event')
      .then(({ processTelnyxWebhookBackground }) =>
        processTelnyxWebhookBackground(body, receivedAt, answerMeta),
      )
      .catch((err) => {
        console.error('[WEBHOOK] background processing failed:', err);
      }),
  );
}

export async function POST(request: NextRequest) {
  const handlerStartMs = Date.now();
  const receivedAt = new Date().toISOString();
  console.log(`[WEBHOOK] START ${receivedAt}`);

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    const verify = verifyTelnyxSignature(rawBody, signature, timestamp);
    if (!verify.ok) {
      console.error('[WEBHOOK] Signature verification FAILED:', verify.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body: TelnyxWebhookBody = JSON.parse(rawBody);
    const event = body.data;

    if (!event?.event_type) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { event_type, payload } = event;
    const callControlId = payload.call_control_id;

    if (event_type === 'call.initiated' && callControlId) {
      if (isBridgeLegClientState(payload.client_state)) {
        console.log(`[WEBHOOK] ANSWER_SKIP bridge_leg +${Date.now() - handlerStartMs}ms`);
        scheduleWebhookBackground(body, receivedAt, skippedAnswerResult('bridge_leg'));
        return NextResponse.json({ received: true });
      }

      const answerResult = await sendTelnyxAnswerFast(callControlId);
      console.log(
        `[WEBHOOK] ANSWER_SENT ${new Date().toISOString()} +${Date.now() - handlerStartMs}ms ok=${answerResult.ok} rt=${answerResult.responseTimeMs}ms`,
      );
      scheduleWebhookBackground(body, receivedAt, answerResult);
      return NextResponse.json({ received: true });
    }

    scheduleWebhookBackground(body, receivedAt, null);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] top-level error:', error);
    return NextResponse.json({ received: true, error: String(error) });
  }
}
