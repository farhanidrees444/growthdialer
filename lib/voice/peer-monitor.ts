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

  pc.addEventListener('iceconnectionstatechange', onIce);
  pc.addEventListener('connectionstatechange', onConn);
  onIce();
  onConn();

  return () => {
    pc.removeEventListener('iceconnectionstatechange', onIce);
    pc.removeEventListener('connectionstatechange', onConn);
  };
}
