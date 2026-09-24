import { TelnyxRTC, type Call as TelnyxCall } from '@telnyx/webrtc';
import {
  handleTelnyxCallStateChange,
  isInboundAwaitingUserAccept,
  patchTelnyxCall,
  type VoiceSdkCall,
} from '@/lib/voice/telnyx-call-shim';
import { eventBus } from './eventBus';

export interface DeviceManagerInitOptions {
  edge?: string;
  logLevel?: number;
}

const INBOUND_RING_STATES = new Set(['ringing', 'trying', 'new', 'requesting']);

function shouldEmitIncoming(call: TelnyxCall): boolean {
  if (call.direction !== 'inbound') return false;
  if (INBOUND_RING_STATES.has(call.state)) return true;
  return isInboundAwaitingUserAccept(call);
}

class DeviceManager {
  private client: TelnyxRTC | null = null;
  private token: string | null = null;
  private incomingEmitted = new WeakSet<object>();
  isReady = false;

  async init(loginToken: string, _options: DeviceManagerInitOptions = {}): Promise<TelnyxRTC> {
    if (this.client && this.token === loginToken && this.isReady) {
      return this.client;
    }

    if (this.client) {
      // Deliberate client replacement (re-init / token refresh), NOT a socket
      // drop. Mark the event expected so listeners don't schedule a redundant
      // reconnect — a fresh client is already connecting below. Scheduling one
      // here would destroy the new client mid-handshake and wedge the voice
      // node in "connecting" forever.
      this.destroy({ expected: true });
    }

    this.token = loginToken;
    this.isReady = false;

    const rtc = new TelnyxRTC({ login_token: loginToken });
    // The hidden remote-audio element rendered by WebPhoneProvider is
    // id="twilio-remote-audio". A previous 'remoteMedia' id matched nothing in
    // the DOM, so the SDK resolved it to null and never attached inbound
    // audio on its own (the app also binds the stream manually as backup).
    rtc.remoteElement = 'twilio-remote-audio';
    this.bindClientEvents(rtc);
    // Assign before connect so any event from a replaced (stale) client can
    // be identified and ignored by the guards in bindClientEvents.
    this.client = rtc;
    rtc.connect();

    return rtc;
  }

  getDevice(): TelnyxRTC | null {
    return this.client;
  }

  async connect(params: Record<string, string>): Promise<VoiceSdkCall> {
    if (!this.client || !this.isReady) {
      throw new Error('Voice device is not registered');
    }

    const call = this.client.newCall({
      destinationNumber: params.To,
      callerNumber: params.CallerId,
    });
    return patchTelnyxCall(call);
  }

  destroy(opts?: { expected?: boolean }): void {
    const client = this.client;
    this.client = null;
    this.token = null;
    this.isReady = false;
    if (client) {
      try {
        client.disconnect();
      } catch {
        // Ignore SDK cleanup errors.
      }
    }
    eventBus.emit('DEVICE_UNREGISTERED', { ...this.snapshot(), expected: opts?.expected ?? false });
  }

  snapshot() {
    return {
      device: this.client,
      isReady: this.isReady,
      state: this.isReady ? 'registered' : 'unregistered',
    };
  }

  private bindClientEvents(rtc: TelnyxRTC): void {
    // Stale-client guard: destroy({ expected: true }) disconnects the old
    // client, which may still emit ready/error/close/incoming afterwards.
    // Only the current client may drive presence and incoming-call events.
    rtc.on('telnyx.ready', () => {
      if (rtc !== this.client) return;
      this.isReady = true;
      eventBus.emit('DEVICE_READY', this.snapshot());
    });

    rtc.on('telnyx.error', (error: Error) => {
      if (rtc !== this.client) return;
      eventBus.emit('DEVICE_ERROR', error);
    });

    rtc.on('telnyx.socket.close', () => {
      if (rtc !== this.client) return;
      this.isReady = false;
      eventBus.emit('DEVICE_UNREGISTERED', { ...this.snapshot(), expected: false });
    });

    rtc.on('telnyx.notification', (notification: { type?: string; call?: TelnyxCall }) => {
      if (rtc !== this.client) return;
      const call = notification.call;
      if (!call || notification.type !== 'callUpdate') return;

      handleTelnyxCallStateChange(call);
      const patched = patchTelnyxCall(call);

      if (shouldEmitIncoming(call) && !this.incomingEmitted.has(call)) {
        this.incomingEmitted.add(call);
        eventBus.emit('DEVICE_INCOMING', patched);
      }
    });
  }
}

export const deviceManager = new DeviceManager();
