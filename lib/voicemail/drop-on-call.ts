import type { SupabaseClient } from '@supabase/supabase-js';
import { telnyxCallAction } from '@/lib/parallel-dial/agent-bridge';

/**
 * Server-side voicemail drop on a Telnyx call_control_id (parallel legs, AMD, etc.)
 */
export async function dropVoicemailOnCallControl(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  callDbId?: string | null,
): Promise<boolean> {
  const { data: vm } = await supabase
    .from('voicemails')
    .select('id, audio_url, drop_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!vm?.audio_url) {
    console.warn('[VM DROP] No voicemail for user', userId);
    return false;
  }

  const ok = await telnyxCallAction(callControlId, 'playback_start', {
    audio_url: vm.audio_url,
    overlay: false,
    loop: false,
  });

  if (!ok) return false;

  void supabase
    .from('voicemails')
    .update({ drop_count: (vm.drop_count ?? 0) + 1 })
    .eq('id', vm.id);

  if (callDbId) {
    void supabase
      .from('calls')
      .update({ disposition: 'voicemail', updated_at: new Date().toISOString() })
      .eq('id', callDbId);
  }

  return true;
}

/** Drop VM then hang up after a short delay so playback can start */
export async function dropVoicemailAndHangup(
  supabase: SupabaseClient,
  userId: string,
  callControlId: string,
  callDbId?: string | null,
  hangupDelayMs = 18000,
): Promise<void> {
  const dropped = await dropVoicemailOnCallControl(supabase, userId, callControlId, callDbId);
  if (dropped) {
    await new Promise((r) => setTimeout(r, hangupDelayMs));
  }
  const { hangupCallControl } = await import('@/lib/parallel-dial/agent-bridge');
  await hangupCallControl(callControlId);
}
