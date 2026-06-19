export const MIN_PLAYABLE_RECORDING_SECONDS = 30;
export const PLAYABLE_RECORDING_DURATION_FILTER =
  `recording_duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS},and(recording_duration_seconds.is.null,duration_seconds.gt.${MIN_PLAYABLE_RECORDING_SECONDS})`;

export function parseRecordingDurationSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const duration = Number.parseInt(value, 10);
  return Number.isFinite(duration) ? duration : null;
}

export function isPlayableRecordingDuration(duration: number | null | undefined): boolean {
  return typeof duration === 'number' && duration > MIN_PLAYABLE_RECORDING_SECONDS;
}
