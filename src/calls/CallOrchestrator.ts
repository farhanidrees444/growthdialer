import type { TelnyxRTC } from '@telnyx/webrtc';
import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';
import { shouldBridgeAutoAnswer } from '@/lib/parallel-dial/auto-answer-flag';
import { readCallParameter } from './callParameters';
import { CallSession } from './CallSession';
import { deviceManager, type DeviceManagerInitOptions } from './DeviceManager';
import { decideInboundCall } from './InboundRouter';
import { eventBus } from './eventBus';

export interface CallOrchestratorSnapshot {
  device: TelnyxRTC | null;
  isReady: boolean;
  incomingCall: VoiceSdkCall | null;
  activeCall: VoiceSdkCall | null;
  isMuted: boolean;
  voiceError: string | null;
  outboundDialActive: boolean;
}

class CallOrchestrator {
  private activeSession: CallSession | null = null;
  private incomingSession: CallSession | null = null;
  private queue: VoiceSdkCall[] = [];
  private outboundDialActive = false;
  private isMuted = false;
  private voiceError: string | null = null;
  private wired = false;

  constructor() {
    this.wireEvents();
  }

  async init(token: string, options?: DeviceManagerInitOptions): Promise<void> {
    this.wireEvents();
    this.voiceError = null;
    await deviceManager.init(token, options);
    this.drainQueue();
    this.emitSnapshot();
  }

  getSnapshot(): CallOrchestratorSnapshot {
    return {
      device: deviceManager.getDevice(),
      isReady: deviceManager.isReady,
      incomingCall: this.incomingSession?.call ?? null,
      activeCall: this.activeSession?.call ?? null,
      isMuted: this.isMuted,
      voiceError: this.voiceError,
      outboundDialActive: this.outboundDialActive,
    };
  }

  handleIncoming(call: VoiceSdkCall): void {
    const decision = decideInboundCall({
      call,
      deviceReady: deviceManager.isReady,
      hasDevice: Boolean(deviceManager.getDevice()),
      hasActiveCall: Boolean(this.activeSession),
      outboundDialActive: this.outboundDialActive,
    });

    if (decision.action === 'queue') {
      this.queue.push(call);
      eventBus.emit('CALL_QUEUED', { reason: decision.reason });
      this.emitSnapshot();
      return;
    }

    if (decision.action === 'reject') {
      try {
        call.reject();
      } catch {
        // Ignore stale call objects.
      }
      eventBus.emit('CALL_REJECTED', { reason: decision.reason });
      return;
    }

    const session = new CallSession(call, 'inbound');
    session.bind();
    this.incomingSession = session;
    this.activeSession = null;
    this.outboundDialActive = false;
    eventBus.emit('CALL_INCOMING', call);
    eventBus.emit('CALL_INCOMING_SESSION', session.snapshot());
    this.emitSnapshot();

    const isMarkedBridgeCall = readCallParameter(call, 'gd_bridge_auto_answer') === '1';
    if (isMarkedBridgeCall && shouldBridgeAutoAnswer()) {
      void this.acceptIncoming();
    }
  }

  async acceptIncoming(options?: unknown): Promise<VoiceSdkCall | null> {
    if (!this.incomingSession) return null;

    const session = this.incomingSession;

    if (session.call.status() !== 'open') {
      session.call.accept(options);
      this.emitSnapshot();
      return session.call;
    }

    this.incomingSession = null;
    this.activeSession = session;
    eventBus.emit('CALL_ACTIVE', session.call);
    eventBus.emit('CALL_ACTIVE_SESSION', session.snapshot());
    this.emitSnapshot();
    return session.call;
  }

  rejectIncoming(): void {
    const session = this.incomingSession;
    this.incomingSession = null;
    if (session) {
      try {
        session.call.reject();
      } catch {
        // Ignore stale call objects.
      }
    }
    this.emitSnapshot();
  }

  async makeCall(toNumber: string, callerId?: string): Promise<VoiceSdkCall | null> {
    this.outboundDialActive = true;
    this.voiceError = null;
    this.emitSnapshot();

    try {
      const call = await deviceManager.connect({
        To: toNumber,
        ...(callerId ? { CallerId: callerId } : {}),
      });
      const session = new CallSession(call, 'outbound', { to: toNumber, from: callerId ?? null });
      session.bind();
      this.activeSession = session;
      this.incomingSession = null;
      this.emitSnapshot();
      return call;
    } catch (error) {
      this.outboundDialActive = false;
      this.voiceError = error instanceof Error ? error.message : 'Could not place call';
      this.emitSnapshot();
      throw error;
    }
  }

  hangup(): void {
    const call = this.incomingSession?.call ?? this.activeSession?.call;
    if (call) {
      try {
        const status = call.status();
        if (status === 'pending' || status === 'ringing') {
          call.reject();
        } else {
          call.disconnect();
        }
      } catch {
        // Ignore stale call objects.
      }
    }
    this.incomingSession = null;
    this.activeSession = null;
    this.outboundDialActive = false;
    this.isMuted = false;
    this.emitSnapshot();
  }

  toggleMute(): boolean {
    const call = this.activeSession?.call;
    if (!call) return this.isMuted;
    this.isMuted = !this.isMuted;
    call.mute(this.isMuted);
    this.emitSnapshot();
    return this.isMuted;
  }

  destroy(): void {
    this.incomingSession = null;
    this.activeSession = null;
    this.queue = [];
    this.outboundDialActive = false;
    this.isMuted = false;
    this.voiceError = null;
    deviceManager.destroy();
    this.emitSnapshot();
  }

  private wireEvents(): void {
    if (this.wired) return;
    this.wired = true;

    eventBus.on<VoiceSdkCall>('DEVICE_INCOMING', (call) => this.handleIncoming(call));
    eventBus.on<Error>('DEVICE_ERROR', (error) => {
      this.voiceError = error.message || 'Voice device error';
      this.emitSnapshot();
    });
    eventBus.on('DEVICE_UNREGISTERED', () => this.emitSnapshot());
    eventBus.on('DEVICE_READY', () => {
      this.drainQueue();
      this.emitSnapshot();
    });
    eventBus.on('CALL_SESSION_ENDED', () => {
      this.incomingSession = null;
      this.activeSession = null;
      this.outboundDialActive = false;
      this.isMuted = false;
      this.emitSnapshot();
    });
    eventBus.on<ReturnType<CallSession['snapshot']>>('CALL_SESSION_UPDATED', (snapshot) => {
      if (snapshot.phase !== 'active') return;
      if (this.incomingSession?.call !== snapshot.call) return;
      this.activeSession = this.incomingSession;
      this.incomingSession = null;
      eventBus.emit('CALL_ACTIVE', snapshot.call);
      eventBus.emit('CALL_ACTIVE_SESSION', snapshot);
      this.emitSnapshot();
    });
  }

  private drainQueue(): void {
    if (!deviceManager.isReady || this.incomingSession || this.activeSession) return;
    const next = this.queue.shift();
    if (next) this.handleIncoming(next);
  }

  private emitSnapshot(): void {
    eventBus.emit('CALL_SNAPSHOT', this.getSnapshot());
  }
}

export const callOrchestrator = new CallOrchestrator();
