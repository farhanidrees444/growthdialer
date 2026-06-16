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

let pendingRemoteStream: MediaStream | null = null;
let playRetryInstalled = false;

function installPlayRetryOnGesture(): void {
  if (playRetryInstalled || typeof window === 'undefined') return;
  playRetryInstalled = true;

  const retry = async () => {
    if (!pendingRemoteStream) return;
    const el = getRemoteAudioElement();
    if (!el) return;

    const stream = pendingRemoteStream;
    pendingRemoteStream = null;

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.muted = false;
    el.volume = 1;

    try {
      await el.play();
      console.log('[RemoteAudio] playback resumed via user gesture');
    } catch (err) {
      console.warn('[RemoteAudio] play() still blocked after gesture:', err);
      // Re-queue for next gesture
      pendingRemoteStream = stream;
    }
  };

  window.addEventListener('pointerdown', retry, { capture: true, once: true });
  window.addEventListener('keydown', retry, { capture: true, once: true });
}

function replayPendingStream(): void {
  if (!pendingRemoteStream) return;
  const el = getRemoteAudioElement();
  if (!el) return;

  const stream = pendingRemoteStream;
  pendingRemoteStream = null;

  if (el.srcObject !== stream) {
    el.srcObject = stream;
  }
  el.muted = false;
  el.volume = 1;

  el.play()
    .then(() => {
      console.log('[RemoteAudio] deferred playback succeeded');
    })
    .catch(() => {
      pendingRemoteStream = stream;
      installPlayRetryOnGesture();
    });
}

/** Bind a remote MediaStream to the hidden playback element and start playback. */
export async function bindRemoteStreamToAudio(stream: MediaStream): Promise<void> {
  const el = getRemoteAudioElement();
  if (!el || !stream) return;

  await resumeVoiceAudioContext();

  // If a previous stream is still pending, discard it — new call takes priority
  if (pendingRemoteStream && pendingRemoteStream !== stream) {
    pendingRemoteStream = null;
  }

  if (el.srcObject !== stream) {
    el.srcObject = stream;
  }
  el.muted = false;
  el.volume = 1;

  try {
    await el.play();
    console.log('[RemoteAudio] playback started immediately');
    pendingRemoteStream = null;
  } catch (err) {
    // Autoplay policy blocked — queue for next user gesture
    console.warn('[RemoteAudio] play() blocked — queueing retry on next user gesture:', err);
    pendingRemoteStream = stream;
    installPlayRetryOnGesture();
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
