import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { advanceInboundRingGroup } from '@/lib/telephony/telnyx/inbound-router';
import { hangupProviderCall } from '@/lib/telephony/telnyx/outbound';
import { resolveNumberRouting } from '@/lib/voice/phone-number-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SWEEP_LIMIT = 50;
const DEFAULT_RING_SECONDS = 25;

function clampRingSeconds(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_RING_SECONDS;
  return Math.min(120, Math.max(10, Math.round(n)));
}

/**
 * Per-minute health sweep for inbound calls (replaces the unreliable
 * fire-and-forget self-fetch ring timeout).
 *
 * a. Ring timeout: inbound calls stuck in `ringing` past the number's
 *    configured ring seconds advance to the next ring-group step.
 * b. Media watchdog: inbound calls `answered` past their
 *    `media_watchdog_deadline` whose Leg B never reached `bridged`
 *    (dead air) are hung up and marked `no_audio`.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  let ringTimeoutsHandled = 0;
  let watchdogsTriggered = 0;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // --- a. Ring-timeout sweep: oldest ringing inbound calls first ---
  const { data: ringing, error: ringingError } = await supabase
    .from('calls')
    .select('id, telnyx_session_id, to_number, started_at')
    .eq('direction', 'inbound')
    .eq('status', 'ringing')
    .not('telnyx_session_id', 'is', null)
    .order('started_at', { ascending: true })
    .limit(SWEEP_LIMIT);

  if (ringingError) {
    console.error('[CRON-INBOUND-SWEEP] ring sweep fetch failed:', ringingError.message);
  } else {
    const ringSecondsCache = new Map<string, number>();
    const resolveRingSeconds = async (toNumber: string | null): Promise<number> => {
      if (!toNumber) return DEFAULT_RING_SECONDS;
      const cached = ringSecondsCache.get(toNumber);
      if (cached !== undefined) return cached;
      let seconds = DEFAULT_RING_SECONDS;
      const { data: owner } = await supabase
        .from('purchased_numbers')
        .select('user_id, id')
        .eq('phone_number', toNumber)
        .neq('status', 'released')
        .limit(1)
        .maybeSingle();
      const ownerId = owner?.user_id as string | undefined;
      if (ownerId) {
        const routing = await resolveNumberRouting(
          supabase,
          ownerId,
          owner?.id as string | undefined,
        );
        seconds = clampRingSeconds(routing.inbound_ring_seconds);
      }
      ringSecondsCache.set(toNumber, seconds);
      return seconds;
    };

    for (const call of ringing ?? []) {
      const sessionId = call.telnyx_session_id as string | null;
      if (!sessionId) continue;
      const startedAt = call.started_at ? new Date(call.started_at as string).getTime() : 0;
      const ringSeconds = await resolveRingSeconds(call.to_number as string | null);
      if (nowMs - startedAt <= ringSeconds * 1000) continue;
      try {
        await advanceInboundRingGroup(supabase, sessionId, 'ring_timeout');
        ringTimeoutsHandled += 1;
      } catch (err) {
        console.error('[CRON-INBOUND-SWEEP] ring timeout advance failed:', sessionId, err);
      }
    }
  }

  // --- b. Media watchdog: answered but Leg B never bridged (dead air) ---
  const { data: stuck, error: stuckError } = await supabase
    .from('calls')
    .select('id, telnyx_call_id')
    .eq('direction', 'inbound')
    .eq('status', 'answered')
    .lt('media_watchdog_deadline', nowIso)
    .neq('leg_b_status', 'bridged')
    .order('media_watchdog_deadline', { ascending: true })
    .limit(SWEEP_LIMIT);

  if (stuckError) {
    console.error('[CRON-INBOUND-SWEEP] watchdog fetch failed:', stuckError.message);
  } else {
    for (const call of stuck ?? []) {
      const id = call.id as string;
      const providerCallId = call.telnyx_call_id as string | null;
      try {
        if (providerCallId) {
          await hangupProviderCall(providerCallId);
        }
        await supabase
          .from('calls')
          .update({
            status: 'ended',
            disposition: 'no_audio',
            media_watchdog_deadline: null,
            ended_at: nowIso,
          })
          .eq('id', id);
        watchdogsTriggered += 1;
      } catch (err) {
        console.error('[CRON-INBOUND-SWEEP] watchdog hangup failed:', id, err);
      }
    }
  }

  console.log(
    '[CRON-INBOUND-SWEEP] done',
    { ring_timeouts_handled: ringTimeoutsHandled, watchdogs_triggered: watchdogsTriggered },
  );
  return NextResponse.json({
    ok: true,
    ring_timeouts_handled: ringTimeoutsHandled,
    watchdogs_triggered: watchdogsTriggered,
  });
}
