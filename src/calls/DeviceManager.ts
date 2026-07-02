import { TelnyxRTC, type Call as TelnyxCall } from '@telnyx/webrtc';
import {
  handleTelnyxCallStateChange,
  patchTelnyxCall,
  type VoiceSdkCall,
} from '@/lib/voice/telnyx-call-shim';
import { eventBus } from './eventBus';

export interface DeviceManagerInitOptions {
  edge?: string;
  logLevel?: number;
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
      this.destroy();
    }

    this.token = loginToken;
    this.isReady = false;

    const rtc = new TelnyxRTC({ login_token: loginToken });
    rtc.remoteElement = 'remoteMedia';
    this.bindClientEvents(rtc);
    rtc.connect();

    this.client = rtc;
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

  destroy(): void {
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
    eventBus.emit('DEVICE_UNREGISTERED', this.snapshot());
  }

  snapshot() {
    return {
      device: this.client,
      isReady: this.isReady,
      state: this.isReady ? 'registered' : 'unregistered',
    };
  }

  private bindClientEvents(rtc: TelnyxRTC): void {
    rtc.on('telnyx.ready', () => {
      this.isReady = true;
      eventBus.emit('DEVICE_READY', this.snapshot());
    });

    rtc.on('telnyx.error', (error: Error) => {
      eventBus.emit('DEVICE_ERROR', error);
    });

    rtc.on('telnyx.socket.close', () => {
      this.isReady = false;
      eventBus.emit('DEVICE_UNREGISTERED', this.snapshot());
    });

    rtc.on('telnyx.notification', (notification: { type?: string; call?: TelnyxCall }) => {
      const call = notification.call;
      if (!call || notification.type !== 'callUpdate') return;

      handleTelnyxCallStateChange(call);
      const patched = patchTelnyxCall(call);

      if (
        call.direction === 'inbound'
        && call.state === 'ringing'
        && !this.incomingEmitted.has(call)
      ) {
        this.incomingEmitted.add(call);
        eventBus.emit('DEVICE_INCOMING', patched);
      }
    });
  }
}

export const deviceManager = new DeviceManager();
