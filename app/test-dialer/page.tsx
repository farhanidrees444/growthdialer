'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

// Password protection for internal testing
const TEST_PASSWORD = process.env.NEXT_PUBLIC_TEST_DIALER_PASSWORD || 'growthdialer2024';

export default function TestDialerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [callState, setCallState] = useState({
    status: 'idle', // idle, connecting, ringing, connected, disconnected
    direction: null as 'inbound' | 'outbound' | null,
    callSid: null as string | null,
    duration: 0,
    isMuted: false,
    isOnHold: false,
    leadId: null as string | null,
    leadName: null as string | null,
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identity, setIdentity] = useState('test-user');
  const [logs, setLogs] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Password authentication
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TEST_PASSWORD) {
      setIsAuthenticated(true);
      addLog('Authenticated successfully');
    } else {
      addLog('Invalid password');
    }
  };

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-50)); // Keep last 50 logs
  };

  // Initialize Twilio Device
  const initDevice = async () => {
    try {
      addLog('Fetching access token...');
      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.status}`);
      }

      const data = await response.json();
      setToken(data.token);
      addLog('Token received, initializing device...');

      // Dynamic import to avoid SSR issues
      const { Device } = await import('@twilio/voice-sdk');
      const twilioDevice = new Device(data.token);
      setDevice(twilioDevice);

      // Register event handlers
      twilioDevice.on('ready', () => {
        addLog('Device ready');
      });

      twilioDevice.on('error', (error: any) => {
        addLog(`Device error: ${error.message}`);
      });

      twilioDevice.on('connect', (conn: any) => {
        addLog('Call connected');
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
        addLog('Call disconnected');
        setConnection(null);
        setCallState(prev => ({
          ...prev,
          status: 'disconnected',
          duration: 0,
        }));
        stopDurationTimer();
      });

      twilioDevice.on('incoming', (conn: any) => {
        addLog('Incoming call received');
        setConnection(conn);
        setCallState(prev => ({
          ...prev,
          status: 'ringing',
          direction: 'inbound',
        }));

        // Auto-accept for testing
        conn.accept();
      });

      twilioDevice.on('cancel', () => {
        addLog('Call cancelled');
        setCallState(prev => ({ ...prev, status: 'idle' }));
      });

      twilioDevice.on('tokenWillExpire', async () => {
        addLog('Token will expire, refreshing...');
        try {
          const refreshResponse = await fetch('/api/twilio/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            twilioDevice.updateToken(refreshData.token);
            setToken(refreshData.token);
            addLog('Token refreshed successfully');
          }
        } catch (error) {
          addLog(`Token refresh failed: ${error}`);
        }
      });

      addLog('Device initialized successfully');

    } catch (error: any) {
      addLog(`Device initialization failed: ${error.message}`);
    }
  };

  // Make outbound call
  const makeCall = async (toNumber: string, leadId?: string, leadName?: string) => {
    if (!device || !toNumber) return;

    try {
      addLog(`Calling ${toNumber}...`);
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
          leadId: leadId || 'test-lead',
          userId: 'test-user',
        }
      });

      setConnection(conn);

    } catch (error: any) {
      addLog(`Call failed: ${error.message}`);
      setCallState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  // Hang up call
  const hangUp = () => {
    if (connection) {
      addLog('Hanging up...');
      connection.disconnect();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (connection) {
      if (callState.isMuted) {
        connection.unmute();
        addLog('Unmuted');
      } else {
        connection.mute();
        addLog('Muted');
      }
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  // Send DTMF digits
  const sendDigits = (digits: string) => {
    if (connection) {
      connection.sendDigits(digits);
      addLog(`Sent digits: ${digits}`);
    }
  };

  // Test server-side call
  const testServerCall = async () => {
    if (!phoneNumber) return;

    try {
      addLog(`Testing server call to ${phoneNumber}...`);
      const response = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          leadId: 'test-lead-server',
          userId: 'test-user-server',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addLog(`Server call initiated: ${data.callSid}`);
      } else {
        addLog(`Server call failed: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`Server call error: ${error.message}`);
    }
  };

  // Duration timer
  const startDurationTimer = () => {
    stopDurationTimer();
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      if (device) {
        device.destroy();
      }
    };
  }, [device]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test Dialer Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter test password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Access Test Dialer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Dialer Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              GrowthDialer Test Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Device Status */}
            <div className="flex items-center gap-4">
              <Badge variant={device ? "default" : "secondary"}>
                Device: {device ? 'Ready' : 'Not Connected'}
              </Badge>
              <Badge variant={token ? "default" : "secondary"}>
                Token: {token ? 'Active' : 'None'}
              </Badge>
            </div>

            {/* Connect Device */}
            {!device && (
              <div className="space-y-4">
                <Input
                  placeholder="Identity (e.g., test-user)"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                />
                <Button onClick={initDevice} className="w-full">
                  Connect Device
                </Button>
              </div>
            )}

            {/* Call Controls */}
            {device && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    callState.status === 'idle' ? 'secondary' :
                    callState.status === 'connecting' ? 'default' :
                    callState.status === 'ringing' ? 'destructive' :
                    callState.status === 'connected' ? 'default' : 'secondary'
                  }>
                    Status: {callState.status}
                  </Badge>
                  {callState.duration > 0 && (
                    <Badge variant="outline">
                      Duration: {formatDuration(callState.duration)}
                    </Badge>
                  )}
                </div>

                <Input
                  placeholder="Phone number (E.164 format)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => makeCall(phoneNumber)}
                    disabled={!phoneNumber || callState.status !== 'idle'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>

                  <Button
                    onClick={hangUp}
                    disabled={!connection}
                    variant="destructive"
                    className="flex-1"
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Hang Up
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={toggleMute}
                    disabled={!connection}
                    variant={callState.isMuted ? "default" : "outline"}
                  >
                    {callState.isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                    {callState.isMuted ? 'Unmute' : 'Mute'}
                  </Button>

                  <Button
                    onClick={testServerCall}
                    disabled={!phoneNumber}
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Server Call
                  </Button>
                </div>

                {/* DTMF Pad */}
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((digit) => (
                    <Button
                      key={digit}
                      onClick={() => sendDigits(digit.toString())}
                      disabled={!connection}
                      variant="outline"
                      size="sm"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}