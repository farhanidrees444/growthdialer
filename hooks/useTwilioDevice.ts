'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'disconnected';
  direction: 'inbound' | 'outbound' | null;
  callSid: string | null;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  leadId: string | null;
  leadName: string | null;
}

interface UseTwilioDeviceReturn {
  device: any;
  connection: any;
  callState: CallState;
  initDevice: (identity: string) => Promise<void>;
  makeCall: (params: { toNumber: string; leadId?: string; leadName?: string; userId?: string }) => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDigits: (digits: string) => void;
  isReady: boolean;
  error: string | null;
}

const initialCallState: CallState = {
  status: 'idle',
  direction: null,
  callSid: null,
  duration: 0,
  isMuted: false,
  isOnHold: false,
  leadId: null,
  leadName: null,
};

export function useTwilioDevice(): UseTwilioDeviceReturn {
  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>(initialCallState);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const identityRef = useRef<string>('');

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  /**
   * Attach v2.x Call-level event listeners.
   * In SDK v2.x the Device no longer emits 'connect'/'disconnect' —
   * those events live on the individual Call object returned by device.connect().
   */
  const attachCallListeners = useCallback((call: any) => {
    // Fired when the other party picks up (outbound) or when we accept (inbound)
    call.on('accept', (acceptedCall: any) => {
      setConnection(acceptedCall);
      setCallState(prev => ({
        ...prev,
        status: 'connected',
        callSid: acceptedCall.parameters?.CallSid ?? null,
        duration: 0,
      }));
      startDurationTimer();
    });

    // Outbound: phone is ringing on the other end
    call.on('ringing', () => {
      setCallState(prev => ({ ...prev, status: 'ringing' }));
    });

    call.on('disconnect', () => {
      setConnection(null);
      setCallState(prev => ({
        ...prev,
        status: 'disconnected',
        isMuted: false,
        isOnHold: false,
        duration: 0,
      }));
      stopDurationTimer();
    });

    call.on('cancel', () => {
      setConnection(null);
      setCallState(prev => ({ ...prev, status: 'idle', isMuted: false, isOnHold: false }));
      stopDurationTimer();
    });

    call.on('error', (callError: any) => {
      setError(callError.message || 'Call error');
      setCallState(prev => ({ ...prev, status: 'idle' }));
      stopDurationTimer();
    });
  }, [startDurationTimer, stopDurationTimer]);

  // Initialize Twilio Device (v2.x)
  const initDevice = useCallback(async (identity: string) => {
    try {
      setError(null);
      identityRef.current = identity;

      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Token request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Dynamic import keeps SSR happy
      const { Device } = await import('@twilio/voice-sdk');

      const twilioDevice = new Device(data.token, {
        logLevel: 1, // 1 = warn, keeps console clean in prod
        codecPreferences: ['opus', 'pcmu'] as any,
      });

      // v2.x: 'registered' replaces the old 'ready' event
      twilioDevice.on('registered', () => {
        setIsReady(true);
        setError(null);
      });

      twilioDevice.on('unregistered', () => {
        setIsReady(false);
      });

      twilioDevice.on('error', (twilioError: any) => {
        setError(twilioError.message || 'Device error');
        setIsReady(false);
      });

      // v2.x: 'incoming' still fires on the Device; attach call-level listeners
      twilioDevice.on('incoming', (call: any) => {
        setConnection(call);
        setCallState(prev => ({
          ...prev,
          status: 'ringing',
          direction: 'inbound',
        }));
        attachCallListeners(call);
        call.accept(); // auto-accept; swap for UI prompt if you need manual accept
      });

      twilioDevice.on('tokenWillExpire', async () => {
        try {
          const refreshResponse = await fetch('/api/twilio/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: identityRef.current }),
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            twilioDevice.updateToken(refreshData.token);
          } else {
            setError('Failed to refresh token');
          }
        } catch {
          setError('Token refresh failed');
        }
      });

      setDevice(twilioDevice);

      // v2.x REQUIRED: must call register() to start receiving incoming calls
      await twilioDevice.register();

    } catch (initError: any) {
      setError(initError.message || 'Failed to initialize device');
      setIsReady(false);
    }
  }, [attachCallListeners]);

  // Make outbound call (v2.x)
  const makeCall = useCallback(async ({
    toNumber, leadId, leadName, userId,
  }: {
    toNumber: string;
    leadId?: string;
    leadName?: string;
    userId?: string;
  }) => {
    if (!device || !toNumber) {
      setError('Device not ready. Click "Connect Device" first.');
      return;
    }

    try {
      setError(null);
      setCallState(prev => ({
        ...prev,
        status: 'connecting',
        direction: 'outbound',
        leadId: leadId ?? null,
        leadName: leadName ?? null,
        isMuted: false,
        isOnHold: false,
      }));

      // v2.x: device.connect() returns a Call object (Promise)
      const call = await device.connect({
        params: {
          To: toNumber,
          leadId: leadId ?? '',
          userId: userId ?? 'unknown-user',
        },
      });

      setConnection(call);
      attachCallListeners(call);

    } catch (callError: any) {
      setError(callError.message || 'Failed to make call');
      setCallState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [device, attachCallListeners]);

  // Hang up
  const hangUp = useCallback(() => {
    if (connection) {
      connection.disconnect();
    } else if (device) {
      device.disconnectAll();
    }
  }, [connection, device]);

  // v2.x: call.mute(boolean) — no separate unmute method
  const toggleMute = useCallback(() => {
    if (!connection) return;
    const newMuted = !callState.isMuted;
    connection.mute(newMuted);
    setCallState(prev => ({ ...prev, isMuted: newMuted }));
  }, [connection, callState.isMuted]);

  // Hold is not in the v2.x browser SDK; update UI state only
  const toggleHold = useCallback(() => {
    if (!connection) return;
    setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
  }, [connection]);

  const sendDigits = useCallback((digits: string) => {
    if (connection) {
      connection.sendDigits(digits);
    }
  }, [connection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      if (device) {
        device.destroy();
      }
    };
  }, [device, stopDurationTimer]);

  return {
    device,
    connection,
    callState,
    initDevice,
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    sendDigits,
    isReady,
    error,
  };
}
