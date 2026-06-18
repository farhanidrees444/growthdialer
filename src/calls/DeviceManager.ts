import { Call, Device } from '@twilio/voice-sdk';
import { eventBus } from './eventBus';

type DeviceOptions = NonNullable<ConstructorParameters<typeof Device>[1]>;

export interface DeviceManagerInitOptions {
  edge?: string;
  logLevel?: DeviceOptions['logLevel'];
}

class DeviceManager {
  private device: Device | null = null;
  private token: string | null = null;
  isReady = false;

  async init(token: string, options: DeviceManagerInitOptions = {}): Promise<Device> {
    if (this.device && this.token) {
      try {
        await this.device.updateToken(token);
        this.token = token;
        if (this.device.state === Device.State.Unregistered) {
          await this.device.register();
        }
        this.isReady = this.device.state === Device.State.Registered;
        if (this.isReady) eventBus.emit('DEVICE_READY', this.snapshot());
        return this.device;
      } catch {
        this.destroy();
      }
    }

    this.token = token;
    this.isReady = false;
    this.device = new Device(token, {
      codecPreferences: ['pcmu', 'opus'] as Call.Codec[],
      closeProtection: true,
      allowIncomingWhileBusy: true,
      ...(options.edge ? { edge: options.edge } : {}),
      ...(options.logLevel != null ? { logLevel: options.logLevel } : {}),
    } as ConstructorParameters<typeof Device>[1]);

    this.registerEvents(this.device);
    await this.device.register();
    this.isReady = this.device.state === Device.State.Registered;
    if (this.isReady) eventBus.emit('DEVICE_READY', this.snapshot());
    return this.device;
  }

  getDevice(): Device | null {
    return this.device;
  }

  async connect(params: Record<string, string>): Promise<Call> {
    if (!this.device || !this.isReady) {
      throw new Error('Voice device is not registered');
    }
    return this.device.connect({ params });
  }

  destroy(): void {
    const device = this.device;
    this.device = null;
    this.token = null;
    this.isReady = false;
    if (device) {
      try {
        device.destroy();
      } catch {
        // Ignore SDK cleanup errors.
      }
    }
    eventBus.emit('DEVICE_UNREGISTERED', this.snapshot());
  }

  snapshot() {
    return {
      device: this.device,
      isReady: this.isReady,
      state: this.device?.state ?? null,
    };
  }

  private registerEvents(device: Device): void {
    device.on('registered', () => {
      this.isReady = true;
      eventBus.emit('DEVICE_READY', this.snapshot());
    });

    device.on('unregistered', () => {
      this.isReady = false;
      eventBus.emit('DEVICE_UNREGISTERED', this.snapshot());
    });

    device.on('error', (error: Error) => {
      eventBus.emit('DEVICE_ERROR', error);
    });

    device.on('incoming', (call: Call) => {
      eventBus.emit('DEVICE_INCOMING', call);
    });
  }
}

export const deviceManager = new DeviceManager();
