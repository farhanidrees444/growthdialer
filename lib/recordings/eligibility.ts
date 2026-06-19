export const MIN_PLAYABLE_RECORDING_SECONDS = 30;

export function parseRecordingDurationSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const duration = Number.parseInt(value, 10);
  return Number.isFinite(duration) ? duration : null;
}

export function isPlayableRecordingDuration(duration: number | null | undefined): boolean {
  return typeof duration === 'number' && duration > MIN_PLAYABLE_RECORDING_SECONDS;
}
