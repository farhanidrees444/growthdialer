import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { verifyTelnyxSignature } from '@/lib/telnyx-signature';
import { voiceServerLog } from '@/lib/debug/voice-server-log';
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

/**
 * Return true only when the call.initiated direction EXPLICITLY marks an
 * inbound leg.  Missing, null, or ambiguous direction values are NOT treated
 * as outbound — they must fall through to the background processor which can
 * resolve ownership via the `to` number.
 *
 * This prevents accidental fast-answer on inbound calls where Telnyx omits
 * the direction field (toll-free, ported numbers, certain carrier routes).
 */
function isExplicitlyOutbound(payload: TelnyxWebhookBody['data']['payload']): boolean {
  const d = String(payload.direction ?? '').toLowerCase();
  return d === 'outgoing' || d === 'outbound';
}

function scheduleWebhookBackground(
  body: TelnyxWebhookBody,
  receivedAt: string,
  answerMeta: FastAnswerResult | null,
): void {
  const eventType = body.data?.event_type;
  const callControlId = body.data?.payload?.call_control_id;

  console.log(
    `[WEBHOOK] Scheduling background: ${eventType} | control=${callControlId} | answerSkipped=${answerMeta?.skipped ?? false}`,
  );

  // #region agent log
  voiceServerLog({
    location: 'webhook:route:scheduleBackground',
    message: 'waitUntil scheduled for background processing',
    data: {
      eventType,
      callControlId: callControlId ?? null,
      answerSkipped: answerMeta?.skipped ?? null,
      skipReason: answerMeta?.skipReason ?? null,
    },
    hypothesisId: 'H-L',
    runId: 'run11',
  });
  // #endregion

  waitUntil(
    import('./process-event')
      .then(({ processTelnyxWebhookBackground }) =>
        processTelnyxWebhookBackground(body, receivedAt, answerMeta),
      )
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[WEBHOOK] background processing failed:', msg);
        voiceServerLog({
          location: 'webhook:route:backgroundFailed',
          message: 'waitUntil background processor rejected',
          data: {
            eventType,
            callControlId: callControlId ?? null,
            error: msg,
          },
          hypothesisId: 'H-L',
          runId: 'run11',
        });
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

      if (!isExplicitlyOutbound(payload)) {
        // Missing or ambiguous direction → assume inbound.
        // The background processor resolves true inbound vs. outbound via
        // number ownership lookup; we must NOT answer a PSTN leg we own.
        const reason = isExplicitlyOutbound(payload) ? 'outbound' : 'inbound_or_ambiguous';
        console.log(`[WEBHOOK] NO_ANSWER ${reason} +${Date.now() - handlerStartMs}ms`);
        scheduleWebhookBackground(body, receivedAt, skippedAnswerResult(reason));
        return NextResponse.json({ received: true });
      }

      // Only reach here when direction explicitly says outbound/outgoing
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
