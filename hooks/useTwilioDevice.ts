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

export function useTwilioDevice(): UseTwilioDeviceReturn {
  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    direction: null,
    callSid: null,
    duration: 0,
    isMuted: false,
    isOnHold: false,
    leadId: null,
    leadName: null,
  });

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Initialize Twilio Device
  const initDevice = useCallback(async (identity: string) => {
    try {
      setError(null);

      // Fetch access token
      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }

      const data = await response.json();

      // Dynamic import to avoid SSR issues
      const { Device } = await import('@twilio/voice-sdk');
      const twilioDevice = new Device(data.token);
      setDevice(twilioDevice);

      // Register event handlers
      twilioDevice.on('ready', () => {
        setIsReady(true);
        setError(null);
      });

      twilioDevice.on('error', (twilioError: any) => {
        setError(twilioError.message);
        setIsReady(false);
      });

      twilioDevice.on('connect', (conn: any) => {
        setConnection(conn);
        setCallState(prev => ({
          ...prev,
          status: 'connected',
          callSid: conn.parameters.CallSid,
          duration: 0,
        }));
        startDurationTimer();
      });

      twilioDevice.on('disconnect', () => {
        setConnection(null);
        setCallState(prev => ({
          ...prev,
          status: 'disconnected',
          duration: 0,
        }));
        stopDurationTimer();
      });

      twilioDevice.on('incoming', (conn: any) => {
        setConnection(conn);
        setCallState(prev => ({
          ...prev,
          status: 'ringing',
          direction: 'inbound',
        }));

        // Auto-accept incoming calls (can be customized)
        conn.accept();
      });

      twilioDevice.on('cancel', () => {
        setCallState(prev => ({ ...prev, status: 'idle' }));
      });

      twilioDevice.on('tokenWillExpire', async () => {
        try {
          const refreshResponse = await fetch('/api/twilio/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            twilioDevice.updateToken(refreshData.token);
          } else {
            setError('Failed to refresh token');
          }
        } catch (refreshError) {
          setError('Token refresh failed');
        }
      });

    } catch (initError: any) {
      setError(initError.message);
      setIsReady(false);
    }
  }, [startDurationTimer, stopDurationTimer]);

  // Make outbound call
  const makeCall = useCallback(async ({ toNumber, leadId, leadName, userId }: {
    toNumber: string;
    leadId?: string;
    leadName?: string;
    userId?: string;
  }) => {
    if (!device || !toNumber) return;

    try {
      setError(null);
      setCallState(prev => ({
        ...prev,
        status: 'connecting',
        direction: 'outbound',
        leadId: leadId || null,
        leadName: leadName || null,
      }));

      const conn = await device.connect({
        params: {
          To: toNumber,
          leadId: leadId || '',
          userId: userId || 'unknown-user',
        }
      });

      setConnection(conn);

    } catch (callError: any) {
      setError(callError.message);
      setCallState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [device]);

  // Hang up call
  const hangUp = useCallback(() => {
    if (connection) {
      connection.disconnect();
    }
  }, [connection]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (connection) {
      if (callState.isMuted) {
        connection.unmute();
      } else {
        connection.mute();
      }
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [connection, callState.isMuted]);

  // Toggle hold state
  const toggleHold = useCallback(() => {
    if (!connection) return;
    if (typeof connection.hold === 'function') {
      if (callState.isOnHold && typeof connection.unhold === 'function') {
        connection.unhold();
      } else {
        connection.hold();
      }
    }
    setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
  }, [connection, callState.isOnHold]);

  // Send DTMF digits
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