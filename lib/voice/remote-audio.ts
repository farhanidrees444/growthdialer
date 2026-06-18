/**
 * Hidden remote-audio element used by Twilio WebRTC for caller audio playback.
 * Both IDs are supported for SDK + legacy references.
 */
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';

export const REMOTE_AUDIO_ELEMENT_ID = 'twilio-remote-audio';
export const REMOTE_AUDIO_LEGACY_ID = 'remote-audio-element';
const DEBUG_ENDPOINT = 'http://127.0.0.1:7379/ingest/0b038bd8-a4b0-46ba-b218-7da01641d89a';

function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  const payload = {
    sessionId: '30998c',
    runId: 'run1',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };

  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '30998c' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch('/api/agent-debug/30998c', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

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
  // #region agent log
  agentDebugLog('H3', 'lib/voice/remote-audio.ts:bindRemoteStreamToAudio:start', 'Remote audio stream binding attempted', {
    hasElement: Boolean(el),
    audioTracks: stream?.getAudioTracks?.().length ?? 0,
    liveAudioTracks: stream?.getAudioTracks?.().filter((track) => track.readyState === 'live').length ?? 0,
    elementPaused: el?.paused ?? null,
    elementMuted: el?.muted ?? null,
  });
  // #endregion

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
    // #region agent log
    agentDebugLog('H3', 'lib/voice/remote-audio.ts:bindRemoteStreamToAudio:play-success', 'Remote audio element play succeeded', {
      paused: el.paused,
      muted: el.muted,
      volume: el.volume,
      audioTracks: stream.getAudioTracks().length,
    });
    // #endregion
    console.log('[RemoteAudio] playback started immediately');
    pendingRemoteStream = null;
  } catch (err) {
    // #region agent log
    agentDebugLog('H3', 'lib/voice/remote-audio.ts:bindRemoteStreamToAudio:play-blocked', 'Remote audio element play failed or was blocked', {
      errorName: err instanceof Error ? err.name : null,
      errorMessage: err instanceof Error ? err.message : String(err),
      paused: el.paused,
      muted: el.muted,
      volume: el.volume,
      audioTracks: stream.getAudioTracks().length,
    });
    // #endregion
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
