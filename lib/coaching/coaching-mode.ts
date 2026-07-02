import type { TelephonyConferenceMode } from '@/lib/telephony/types';

export type CoachingUiMode = 'listen' | 'whisper' | 'barge' | 'takeover';

export function toTelephonyMode(mode: string): TelephonyConferenceMode {
  if (mode === 'whisper' || mode === 'barge' || mode === 'takeover') return mode;
  return 'listen';
}

export function supervisorRoleForMode(
  mode: TelephonyConferenceMode,
): 'monitor' | 'whisper' | 'barge' {
  switch (mode) {
    case 'whisper':
      return 'whisper';
    case 'barge':
    case 'takeover':
      return 'barge';
    case 'listen':
    default:
      return 'monitor';
  }
}
