import type { SupabaseClient } from '@supabase/supabase-js';
import { bridgeProspectToAgent, hangupCallControl } from './agent-bridge';

/**
 * When a parallel-dial leg is answered, claim winner (first answer wins),
 * cancel other ringing legs, and bridge prospect to agent WebRTC.
 */
export async function handleParallelLegAnswered(
  supabase: SupabaseClient,
  callControlId: string,
  fromNumber: string | null,
): Promise<{ bridged: boolean; sessionId?: string; legId?: string }> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner')
    .eq('telnyx_call_id', callControlId)
    .maybeSingle();

  if (!leg) return { bridged: false };

  const { data: claimed } = await supabase
    .from('parallel_dial_legs')
    .update({
      is_winner: true,
      status: 'connected',
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

  const { data: otherLegs } = await supabase
    .from('parallel_dial_legs')
    .select('id, telnyx_call_id')
    .eq('session_id', claimed.session_id)
    .neq('id', claimed.id)
    .in('status', ['dialing', 'ringing', 'answered']);

  await Promise.all(
    (otherLegs ?? []).map(async (other) => {
      if (other.telnyx_call_id) await hangupCallControl(other.telnyx_call_id);
      await supabase
        .from('parallel_dial_legs')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', other.id);
    }),
  );

  const bridged = await bridgeProspectToAgent(callControlId, fromNumber ?? process.env.TELNYX_FROM_NUMBER ?? '');

  const { data: sess } = await supabase
    .from('parallel_dial_sessions')
    .select('total_connects')
    .eq('id', claimed.session_id)
    .single();

  if (sess) {
    await supabase
      .from('parallel_dial_sessions')
      .update({
        status: 'connected',
        total_connects: (sess.total_connects ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimed.session_id);
  }

  return { bridged, sessionId: claimed.session_id, legId: claimed.id };
}

export async function handleParallelLegHangup(
  supabase: SupabaseClient,
  callControlId: string,
  hangupCause?: string | null,
): Promise<void> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner')
    .eq('telnyx_call_id', callControlId)
    .maybeSingle();

  if (!leg || leg.is_winner) return;

  const terminal = hangupCause === 'user_busy' ? 'busy' : 'no_answer';
  await supabase
    .from('parallel_dial_legs')
    .update({
      status: leg.status === 'failed' ? 'failed' : terminal,
      hangup_cause: hangupCause ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leg.id);

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
