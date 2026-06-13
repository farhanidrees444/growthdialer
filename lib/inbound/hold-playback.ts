import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';

/** Public MP3/WAV URL reachable by Telnyx (override via INBOUND_HOLD_AUDIO_URL). */
export function inboundHoldAudioUrl(): string {
  const custom = process.env.INBOUND_HOLD_AUDIO_URL?.trim();
  if (custom) return custom;
  const base = (
    process.env.APP_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || 'https://app.growthdialer.com'
  ).replace(/\/$/, '');
  return `${base}/audio/inbound-hold.mp3`;
}

export async function startInboundHoldPlayback(callControlId: string): Promise<boolean> {
  return telnyxCallAction(callControlId, 'playback_start', {
    audio_url: inboundHoldAudioUrl(),
    overlay: false,
    loop: 1,
  });
}

export async function stopInboundHoldPlayback(callControlId: string): Promise<boolean> {
  return telnyxCallAction(callControlId, 'playback_stop');
}
