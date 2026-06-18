import type { Call } from '@twilio/voice-sdk';

export type IceConnectionQuality =
  | 'excellent'
  | 'good'
  | 'degraded'
  | 'disconnected'
  | 'unknown';

export function mapIceStateToQuality(state: string): IceConnectionQuality {
  switch (state) {
    case 'connected':
    case 'completed':
      return 'excellent';
    case 'checking':
      return 'good';
    case 'disconnected':
      return 'degraded';
    case 'failed':
    case 'closed':
      return 'disconnected';
    default:
      return 'unknown';
  }
}

type PeerConnectionLike = RTCPeerConnection & { connectionState?: string };

/**
 * Extract the underlying RTCPeerConnection from a Twilio Call object.
 */
export function getCallPeerConnection(call: Call): PeerConnectionLike | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = call as any;

  const mediaHandler = c._mediaHandler;
  if (mediaHandler) {
    return (
      mediaHandler._peerConnection
      ?? mediaHandler.peerConnection
      ?? mediaHandler._pc
      ?? mediaHandler.pc
      ?? null
    );
  }

  return c._peerConnection ?? c.peerConnection ?? c._pc ?? c.pc ?? null;
}

function tryIceRestart(pc: RTCPeerConnection): void {
  if (typeof pc.restartIce !== 'function') return;
  try {
    pc.restartIce();
    console.warn('[PeerMonitor] ICE restart requested');
  } catch (err) {
    console.warn('[PeerMonitor] ICE restart failed:', err);
  }
}

export function attachPeerConnectionMonitor(
  call: Call,
  handlers: {
    onIceState?: (state: string, quality: IceConnectionQuality) => void;
    onConnectionState?: (state: string) => void;
    onRemoteTrack?: (stream: MediaStream) => void;
  },
): () => void {
  const pc = getCallPeerConnection(call);
  if (!pc) return () => {};

  let iceRestartTimer: ReturnType<typeof setTimeout> | null = null;
  let lastRestartAt = 0;
  const ICE_RESTART_DEBOUNCE_MS = 900;
  const ICE_DISCONNECTED_GRACE_MS = 750;

  const scheduleIceRestart = () => {
    if (iceRestartTimer) clearTimeout(iceRestartTimer);
    iceRestartTimer = setTimeout(() => {
      const state = pc.iceConnectionState;
      if (state !== 'disconnected' && state !== 'failed') return;
      const now = Date.now();
      if (now - lastRestartAt < ICE_RESTART_DEBOUNCE_MS) return;
      lastRestartAt = now;
      tryIceRestart(pc);
    }, ICE_DISCONNECTED_GRACE_MS);
  };

  const onIce = () => {
    const state = pc.iceConnectionState ?? 'unknown';
    handlers.onIceState?.(state, mapIceStateToQuality(state));

    if (state === 'connected' || state === 'completed') {
      if (iceRestartTimer) {
        clearTimeout(iceRestartTimer);
        iceRestartTimer = null;
      }
      return;
    }

    if (state === 'disconnected' || state === 'failed') {
      scheduleIceRestart();
    }
  };

  const onConn = () => {
    const state = pc.connectionState ?? 'unknown';
    handlers.onConnectionState?.(state);
    if (state === 'failed') {
      scheduleIceRestart();
    }
  };

  const onTrack = (ev: RTCTrackEvent) => {
    if (ev.track.kind !== 'audio') return;
    const stream = ev.streams[0] ?? new MediaStream([ev.track]);
    handlers.onRemoteTrack?.(stream);
  };

  pc.addEventListener('iceconnectionstatechange', onIce);
  pc.addEventListener('connectionstatechange', onConn);
  pc.addEventListener('track', onTrack);
  onIce();
  onConn();

  for (const receiver of pc.getReceivers()) {
    if (receiver.track?.kind === 'audio' && receiver.track.readyState === 'live') {
      handlers.onRemoteTrack?.(new MediaStream([receiver.track]));
    }
  }

  return () => {
    if (iceRestartTimer) clearTimeout(iceRestartTimer);
    pc.removeEventListener('iceconnectionstatechange', onIce);
    pc.removeEventListener('connectionstatechange', onConn);
    pc.removeEventListener('track', onTrack);
  };
}
