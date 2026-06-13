import type Call from '@telnyx/webrtc/lib/src/Modules/Verto/webrtc/Call';

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

export function getCallPeerConnection(call: Call): PeerConnectionLike | null {
  const c = call as Call & {
    peer?: { instance?: { pc?: PeerConnectionLike; peer?: PeerConnectionLike } };
    peerConnection?: PeerConnectionLike;
  };
  return c.peerConnection ?? c.peer?.instance?.pc ?? c.peer?.instance?.peer ?? null;
}

export function attachPeerConnectionMonitor(
  call: Call,
  handlers: {
    onIceState?: (state: string, quality: IceConnectionQuality) => void;
    onConnectionState?: (state: string) => void;
    /** Fired when remote audio track arrives — bind to hidden <audio> here. */
    onRemoteTrack?: (stream: MediaStream) => void;
  },
): () => void {
  const pc = getCallPeerConnection(call);
  if (!pc) return () => {};

  const onIce = () => {
    const state = pc.iceConnectionState ?? 'unknown';
    handlers.onIceState?.(state, mapIceStateToQuality(state));
  };
  const onConn = () => {
    handlers.onConnectionState?.(pc.connectionState ?? 'unknown');
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

  // Tracks may already exist before listeners attach (fast answer path).
  for (const receiver of pc.getReceivers()) {
    if (receiver.track?.kind === 'audio' && receiver.track.readyState === 'live') {
      handlers.onRemoteTrack?.(new MediaStream([receiver.track]));
    }
  }

  return () => {
    pc.removeEventListener('iceconnectionstatechange', onIce);
    pc.removeEventListener('connectionstatechange', onConn);
    pc.removeEventListener('track', onTrack);
  };
}
