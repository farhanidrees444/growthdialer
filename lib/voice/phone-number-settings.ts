import type { SupabaseClient } from '@supabase/supabase-js';

export interface PhoneNumberSettingsRow {
  id: string;
  purchased_number_id: string;
  workspace_id: string | null;
  user_id: string;
  recording_enabled: boolean;
  inbound_mode: string | null;
  inbound_forward_number: string | null;
  inbound_ring_seconds: number | null;
  cnam_presentation: string | null;
}

export interface ResolvedNumberRouting {
  recording_enabled: boolean;
  inbound_mode: 'browser' | 'forward' | 'voicemail' | 'off';
  inbound_forward_number: string | null;
  inbound_ring_seconds: number;
  cnam_presentation: string | null;
  user_recording_mode: string;
}

const DEFAULT_RING = 25;

export async function getPhoneNumberSettings(
  supabase: SupabaseClient,
  purchasedNumberId: string,
): Promise<PhoneNumberSettingsRow | null> {
  const { data } = await supabase
    .from('phone_number_settings')
    .select('*')
    .eq('purchased_number_id', purchasedNumberId)
    .maybeSingle();
  return (data as PhoneNumberSettingsRow | null) ?? null;
}

export async function getPhoneNumberSettingsByDid(
  supabase: SupabaseClient,
  purchasedNumberId: string | undefined,
  userId: string,
): Promise<PhoneNumberSettingsRow | null> {
  if (!purchasedNumberId) return null;
  return getPhoneNumberSettings(supabase, purchasedNumberId);
}

/** Merge per-number overrides with workspace user defaults. */
export async function resolveNumberRouting(
  supabase: SupabaseClient,
  userId: string,
  purchasedNumberId: string | undefined,
): Promise<ResolvedNumberRouting> {
  const [userSettings, numberSettings] = await Promise.all([
    supabase
      .from('user_settings')
      .select('inbound_mode, inbound_forward_number, inbound_ring_seconds, recording_mode')
      .eq('user_id', userId)
      .maybeSingle(),
    purchasedNumberId
      ? getPhoneNumberSettings(supabase, purchasedNumberId)
      : Promise.resolve(null),
  ]);

  const user = userSettings.data;
  const num = numberSettings;

  const inboundMode = (
    num?.inbound_mode
    ?? user?.inbound_mode
    ?? 'browser'
  ) as ResolvedNumberRouting['inbound_mode'];

  const configuredRing = num?.inbound_ring_seconds ?? user?.inbound_ring_seconds ?? DEFAULT_RING;
  const ringSeconds = inboundMode === 'browser' ? Math.max(configuredRing, 55) : configuredRing;

  const userRecordingMode = (user?.recording_mode as string | null) ?? 'always';
  const recordingEnabled =
    num?.recording_enabled !== false
    && userRecordingMode !== 'never';

  return {
    recording_enabled: recordingEnabled,
    inbound_mode: inboundMode,
    inbound_forward_number:
      num?.inbound_forward_number ?? (user?.inbound_forward_number as string | null) ?? null,
    inbound_ring_seconds: ringSeconds,
    cnam_presentation: num?.cnam_presentation ?? null,
    user_recording_mode: userRecordingMode,
  };
}

export async function upsertPhoneNumberSettings(
  supabase: SupabaseClient,
  params: {
    purchasedNumberId: string;
    userId: string;
    workspaceId?: string | null;
    patch: Partial<Pick<
      PhoneNumberSettingsRow,
      | 'recording_enabled'
      | 'inbound_mode'
      | 'inbound_forward_number'
      | 'inbound_ring_seconds'
      | 'cnam_presentation'
    >>;
  },
): Promise<PhoneNumberSettingsRow | null> {
  const { purchasedNumberId, userId, workspaceId, patch } = params;

  const { data: existing } = await supabase
    .from('phone_number_settings')
    .select('id')
    .eq('purchased_number_id', purchasedNumberId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('phone_number_settings')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as PhoneNumberSettingsRow;
  }

  const { data, error } = await supabase
    .from('phone_number_settings')
    .insert({
      purchased_number_id: purchasedNumberId,
      user_id: userId,
      workspace_id: workspaceId ?? null,
      ...patch,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PhoneNumberSettingsRow;
}
