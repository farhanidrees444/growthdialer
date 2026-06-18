import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';
import { triggerInboundRingTimeoutAsync } from '@/lib/inbound/trigger-ring-timeout';
import { isAgentVoiceReady } from '@/lib/inbound/agent-presence';
import { logInboundCallStep } from '@/lib/inbound/call-step-log';
import { broadcastIncomingCallEvent } from '@/lib/inbound/incoming-calls-broadcast';
import {
  resolveNumberRouting,
  type ResolvedNumberRouting,
} from '@/lib/voice/phone-number-settings';
import { voiceLog } from '@/lib/voice/structured-log';
import { voiceSessionLog } from '@/lib/voice/session-log';

export interface InboundInitiatedContext {
  callControlId: string;
  callSessionId: string | undefined;
  fromNumber: string | null;
  toNumber: string;
  userId: string;
  workspaceId: string | null;
  purchasedNumberId: string | undefined;
  dbCallId: string | undefined;
}

async function startRecordingIfEnabled(
  callControlId: string,
  routing: ResolvedNumberRouting,
): Promise<void> {
  if (!routing.recording_enabled) return;
  await telnyxCallAction(callControlId, 'record_start', {
    format: 'mp3',
    channels: 'dual',
    play_beep: false,
  });
}

async function routeToVoicemail(
  supabase: SupabaseClient,
  ctx: InboundInitiatedContext,
  routing: ResolvedNumberRouting,
  reason: string,
): Promise<void> {
  voiceLog.info(
    {
      service: 'inbound-routing',
      event: 'fallback_voicemail',
      user_id: ctx.userId,
      call_id: ctx.dbCallId,
      call_control_id: ctx.callControlId,
      did: ctx.toNumber,
      reason,
    },
    'Inbound cascading to voicemail',
  );

  await telnyxCallAction(ctx.callControlId, 'answer');
  await telnyxCallAction(ctx.callControlId, 'record_start', {
    format: 'mp3',
    channels: routing.inbound_mode === 'voicemail' ? 'single' : 'dual',
    play_beep: routing.inbound_mode === 'voicemail',
  });

  if (ctx.dbCallId) {
    await supabase
      .from('calls')
      .update({ status: 'voicemail', disposition: 'voicemail' })
      .eq('id', ctx.dbCallId);
  }
}

async function routeToForward(
  supabase: SupabaseClient,
  ctx: InboundInitiatedContext,
  routing: ResolvedNumberRouting,
): Promise<void> {
  const forwardTo = normalizeE164(routing.inbound_forward_number ?? '');
  if (!forwardTo) {
    await routeToVoicemail(supabase, ctx, routing, 'forward_number_missing');
    return;
  }

  await telnyxCallAction(ctx.callControlId, 'answer');
  await new Promise((r) => setTimeout(r, 400));
  await telnyxCallAction(ctx.callControlId, 'transfer', {
    to: forwardTo,
    from: ctx.toNumber,
  });

  if (routing.recording_enabled) {
    await startRecordingIfEnabled(ctx.callControlId, routing);
  }

  if (ctx.dbCallId) {
    triggerInboundRingTimeoutAsync(
      ctx.dbCallId,
      ctx.callControlId,
      ctx.userId,
      routing.inbound_ring_seconds,
      'forward',
    );
  }

  voiceLog.info(
    {
      service: 'inbound-routing',
      event: 'forward',
      user_id: ctx.userId,
      call_id: ctx.dbCallId,
      did: ctx.toNumber,
    },
    'Inbound forwarded',
  );
}

async function applyBrowserFallback(
  supabase: SupabaseClient,
  ctx: InboundInitiatedContext,
  routing: ResolvedNumberRouting,
  reason: string,
): Promise<void> {
  if (routing.inbound_forward_number) {
    await routeToForward(supabase, ctx, routing);
    return;
  }
  await routeToVoicemail(supabase, ctx, routing, reason);
}

/**
 * Execute inbound routing matrix from DB-driven settings.
 * Never leaves PSTN leg hanging without voicemail/forward fallback.
 */
export async function executeInboundRouting(
  supabase: SupabaseClient,
  ctx: InboundInitiatedContext,
): Promise<void> {
  const routing = await resolveNumberRouting(
    supabase,
    ctx.userId,
    ctx.purchasedNumberId,
  );

  const logCtx = {
    service: 'inbound-routing',
    user_id: ctx.userId,
    workspace_id: ctx.workspaceId ?? undefined,
    call_id: ctx.dbCallId,
    call_control_id: ctx.callControlId,
    did: ctx.toNumber,
    inbound_mode: routing.inbound_mode,
  };

  if (routing.inbound_mode === 'off') {
    await telnyxCallAction(ctx.callControlId, 'reject', { cause: 'CALL_REJECTED' });
    if (ctx.dbCallId) {
      await supabase
        .from('calls')
        .update({
          status: 'rejected',
          disposition: 'missed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', ctx.dbCallId);
    }
    voiceLog.info(logCtx, 'Inbound rejected (off mode)');
    return;
  }

  if (routing.inbound_mode === 'voicemail') {
    await routeToVoicemail(supabase, ctx, routing, 'voicemail_mode');
    return;
  }

  if (routing.inbound_mode === 'forward') {
    await routeToForward(supabase, ctx, routing);
    return;
  }

  // browser mode — PSTN rings until agent accepts; notify dashboard via Realtime
  const agentOnline = await isAgentVoiceReady(supabase, ctx.userId);

  await logInboundCallStep(supabase, ctx.callControlId, 'agent_notified');
  await broadcastIncomingCallEvent(supabase, ctx.userId, 'incoming_call', {
    call_control_id: ctx.callControlId,
    caller_number: ctx.fromNumber,
    call_id: ctx.dbCallId,
    to_number: ctx.toNumber,
    status: 'ringing',
    timestamp: new Date().toISOString(),
  });

  // #region agent log
  void voiceSessionLog({
    location: 'routing-matrix:broadcastDispatched',
    message: 'broadcastIncomingCallEvent dispatched',
    data: {
      userId: ctx.userId,
      callControlId: ctx.callControlId,
      dbCallId: ctx.dbCallId ?? null,
      callerNumber: ctx.fromNumber ?? null,
      agentOnline,
    },
    hypothesisId: 'H-M',
    runId: 'run11',
  });
  // #endregion

  if (!agentOnline) {
    voiceLog.info(
      { ...logCtx, event: 'browser_notify_stale_presence' },
      'Inbound notified agent (stale presence heartbeat)',
    );
  } else {
    voiceLog.info(
      { ...logCtx, event: 'browser_notify' },
      'Inbound agent notified — awaiting accept',
    );
  }

  if (ctx.dbCallId) {
    triggerInboundRingTimeoutAsync(
      ctx.dbCallId,
      ctx.callControlId,
      ctx.userId,
      routing.inbound_ring_seconds,
      'browser',
    );
  }
}

export async function shouldRecordInboundAnswer(
  supabase: SupabaseClient,
  userId: string,
  purchasedNumberId: string | undefined,
  toNumber: string | undefined,
): Promise<boolean> {
  let numberId = purchasedNumberId;
  if (!numberId && toNumber) {
    const { data } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('phone_number', normalizeE164(toNumber))
      .neq('status', 'released')
      .limit(1)
      .maybeSingle();
    numberId = data?.id as string | undefined;
  }
  const routing = await resolveNumberRouting(supabase, userId, numberId);
  return routing.recording_enabled;
}