import type { SupabaseClient } from '@supabase/supabase-js';
import { dropVoicemailAndHangup } from '@/lib/voicemail/drop-on-call';
import { bridgeParallelWinner } from './handle-answered';
import { hangupCallControl } from './agent-bridge';
import { isTwilioProvider } from '@/lib/voice/provider';

/**
 * Telnyx AMD result: machine | human | not_sure | fax | silent
 */
export async function handleParallelLegAmd(
  supabase: SupabaseClient,
  callControlId: string,
  result: string,
  fromNumber: string | null,
): Promise<void> {
  const { data: leg } = await supabase
    .from('parallel_dial_legs')
    .select('id, session_id, status, is_winner, call_id')
    .eq('telnyx_call_id', callControlId)
    .maybeSingle();

  if (!leg || !leg.is_winner) return;

  const { data: session } = await supabase
    .from('parallel_dial_sessions')
    .select('user_id, vm_drop_enabled, amd_enabled')
    .eq('id', leg.session_id)
    .single();

  if (!session?.amd_enabled) return;

  const isMachine = result === 'machine' || result === 'fax';
  const isHuman = result === 'human' || result === 'not_sure';

  if (isMachine) {
    await supabase
      .from('parallel_dial_legs')
      .update({
        is_winner: false,
        status: 'voicemail',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leg.id);

    if (leg.call_id) {
      const now = new Date().toISOString();
      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: now, disposition: 'voicemail' })
        .eq('id', leg.call_id)
        .is('ended_at', null);
    }

    if (session.vm_drop_enabled) {
      void dropVoicemailAndHangup(
        supabase,
        session.user_id,
        callControlId,
        leg.call_id,
        15000,
      );
    } else {
      await hangupCallControl(callControlId);
    }
    return;
  }

  if (isHuman && leg.status === 'answered') {
    if (isTwilioProvider()) {
      await supabase
        .from('parallel_dial_legs')
        .update({ status: 'connected', updated_at: new Date().toISOString() })
        .eq('id', leg.id);
      return;
    }
    await bridgeParallelWinner(supabase, leg.id, callControlId, fromNumber, session.user_id);
  }
}
