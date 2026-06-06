import type { SupabaseClient } from '@supabase/supabase-js';
import { bridgeProspectToAgent, hangupCallControl } from './agent-bridge';
import { dropVoicemailAndHangup } from '@/lib/voicemail/drop-on-call';

async function cancelOtherLegs(
  supabase: SupabaseClient,
  sessionId: string,
  winnerLegId: string,
  userId: string,
  vmDrop: boolean,
): Promise<void> {
  const { data: otherLegs } = await supabase
    .from('parallel_dial_legs')
    .select('id, telnyx_call_id, call_id, status')
    .eq('session_id', sessionId)
    .neq('id', winnerLegId)
    .in('status', ['dialing', 'ringing', 'answered']);

  await Promise.all(
    (otherLegs ?? []).map(async (other) => {
      if (!other.telnyx_call_id) {
        await supabase
          .from('parallel_dial_legs')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', other.id);
        return;
      }
      if (vmDrop && other.status === 'answered') {
        void dropVoicemailAndHangup(supabase, userId, other.telnyx_call_id, other.call_id, 12000);
        await supabase
          .from('parallel_dial_legs')
          .update({ status: 'voicemail', updated_at: new Date().toISOString() })
          .eq('id', other.id);
      } else {
        await hangupCallControl(other.telnyx_call_id);
        await supabase
          .from('parallel_dial_legs')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', other.id);
      }
    }),
  );
}

async function markSessionConnected(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { data: sess } = await supabase
    .from('parallel_dial_sessions')
    .select('total_connects')
    .eq('id', sessionId)
    .single();

  if (sess) {
    await supabase
      .from('parallel_dial_sessions')
      .update({
        status: 'connected',
        total_connects: (sess.total_connects ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }
}

/**
 * Bridge a claimed winner leg to the agent (after AMD confirms human, or AMD off).
 */
export async function bridgeParallelWinner(
  supabase: SupabaseClient,
  legId: string,
  callControlId: string,
  fromNumber: string | null,
): Promise<boolean> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, is_winner, status')
    .eq('id', legId)
    .single();

  if (!leg?.is_winner || leg.status === 'connected') return false;

  const bridged = await bridgeProspectToAgent(
    callControlId,
    fromNumber ?? process.env.TELNYX_FROM_NUMBER ?? '',
  );

  await supabase
    .from('parallel_dial_legs')
    .update({ status: 'connected', updated_at: new Date().toISOString() })
    .eq('id', legId);

  await markSessionConnected(supabase, leg.session_id);
  return bridged;
}

/**
 * When a parallel-dial leg is answered, claim winner (first answer wins),
 * cancel other ringing legs, and bridge prospect to agent WebRTC.
 */
export async function handleParallelLegAnswered(
  supabase: SupabaseClient,
  callControlId: string,
  fromNumber: string | null,
): Promise<{ bridged: boolean; sessionId?: string; legId?: string; pendingAmd?: boolean }> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner')
    .eq('telnyx_call_id', callControlId)
    .maybeSingle();

  if (!leg) return { bridged: false };

  const { data: sessionRow } = await supabase
    .from('parallel_dial_sessions')
    .select('user_id, vm_drop_enabled, amd_enabled')
    .eq('id', leg.session_id)
    .single();

  const pendingStatus = sessionRow?.amd_enabled ? 'answered' : 'connected';

  const { data: claimed } = await supabase
    .from('parallel_dial_legs')
    .update({
      is_winner: true,
      status: pendingStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leg.id)
    .eq('is_winner', false)
    .in('status', ['dialing', 'ringing', 'answered'])
    .select('id, session_id')
    .maybeSingle();

  if (!claimed) {
    await hangupCallControl(callControlId);
    await supabase
      .from('parallel_dial_legs')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', leg.id);
    return { bridged: false };
  }

  await cancelOtherLegs(
    supabase,
    claimed.session_id,
    claimed.id,
    sessionRow?.user_id ?? '',
    sessionRow?.vm_drop_enabled ?? false,
  );

  if (sessionRow?.amd_enabled) {
    return {
      bridged: false,
      pendingAmd: true,
      sessionId: claimed.session_id,
      legId: claimed.id,
    };
  }

  const bridged = await bridgeProspectToAgent(
    callControlId,
    fromNumber ?? process.env.TELNYX_FROM_NUMBER ?? '',
  );

  await markSessionConnected(supabase, claimed.session_id);

  return { bridged, sessionId: claimed.session_id, legId: claimed.id };
}

export async function handleParallelLegHangup(
  supabase: SupabaseClient,
  callControlId: string,
  hangupCause?: string | null,
): Promise<void> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner, call_id')
    .eq('telnyx_call_id', callControlId)
    .maybeSingle();

  if (!leg) return;
  if (leg.is_winner && leg.status === 'connected') return;

  const closeLegCallRow = async () => {
    if (!leg.call_id) return;
    const now = new Date().toISOString();
    await supabase
      .from('calls')
      .update({
        status: 'completed',
        ended_at: now,
        updated_at: now,
      })
      .eq('id', leg.call_id)
      .is('ended_at', null)
      .neq('status', 'answered');
  };

  if (leg.is_winner && leg.status === 'answered') {
    await supabase
      .from('parallel_dial_legs')
      .update({
        is_winner: false,
        status: 'no_answer',
        hangup_cause: hangupCause ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leg.id);
    await closeLegCallRow();
  } else if (!leg.is_winner) {
    const terminal = hangupCause === 'user_busy' ? 'busy' : 'no_answer';
    await supabase
      .from('parallel_dial_legs')
      .update({
        status: leg.status === 'failed' ? 'failed' : terminal,
        hangup_cause: hangupCause ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leg.id);
    await closeLegCallRow();
  }

  const { data: session } = await supabase
    .from('parallel_dial_sessions')
    .select('id, status')
    .eq('id', leg.session_id)
    .single();

  if (!session || session.status !== 'dialing') return;

  const { data: activeLegs } = await supabase
    .from('parallel_dial_legs')
    .select('id')
    .eq('session_id', leg.session_id)
    .in('status', ['dialing', 'ringing', 'answered']);

  if (!activeLegs?.length) {
    await supabase
      .from('parallel_dial_sessions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', leg.session_id);
  }
}
