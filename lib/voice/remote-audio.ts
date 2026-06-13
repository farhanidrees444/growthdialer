/**
 * Hidden remote-audio element used by Telnyx WebRTC for caller audio playback.
 * Both IDs are supported for SDK + legacy references.
 */
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';

export const REMOTE_AUDIO_ELEMENT_ID = 'telnyx-remote-audio';
export const REMOTE_AUDIO_LEGACY_ID = 'remote-audio-element';

export function getRemoteAudioElement(): HTMLAudioElement | null {
  if (typeof document === 'undefined') return null;
  return (
    document.getElementById(REMOTE_AUDIO_ELEMENT_ID) as HTMLAudioElement | null
    ?? document.getElementById(REMOTE_AUDIO_LEGACY_ID) as HTMLAudioElement | null
    ?? document.querySelector(`[data-remote-audio="${REMOTE_AUDIO_LEGACY_ID}"]`) as HTMLAudioElement | null
  );
}

/** Bind a remote MediaStream to the hidden playback element and start playback. */
export async function bindRemoteStreamToAudio(stream: MediaStream): Promise<void> {
  const el = getRemoteAudioElement();
  if (!el || !stream) return;

  await resumeVoiceAudioContext();

  if (el.srcObject !== stream) {
    el.srcObject = stream;
  }
  el.muted = false;
  el.volume = 1;

  try {
    await el.play();
  } catch (err) {
    console.warn('[RemoteAudio] play() blocked — retry after user gesture:', err);
  }
}

/** Unlock playback element without a stream (user-gesture priming). */
export async function unlockRemoteAudioElement(): Promise<void> {
  const el = getRemoteAudioElement();
  if (!el) return;
  await resumeVoiceAudioContext();
  el.muted = false;
  try {
    await el.play();
  } catch { /* no stream yet */ }
}
