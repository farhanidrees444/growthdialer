'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useWebPhone } from '@/contexts/webphone-context';
import { bestEffortE164 } from '@/lib/phone';
import type { LeadRecord } from '@/components/dialer/LeadCard';

export interface CallMeta {
  lead: LeadRecord | null;
  phone: string;
  startedAt: Date | null;
}

export interface CallContextValue {
  /** Lead being called (null for manual/unknown calls) */
  activeLead: LeadRecord | null;
  /** Phone number being called */
  activePhone: string;
  /** When the call was ANSWERED (active state started) */
  callAnsweredAt: Date | null;
  /** When the call was INITIATED (makeCall triggered) */
  callInitiatedAt: Date | null;

  /** Start a call from anywhere (leads page, etc.) — async: fetches default caller number if not provided */
  startCall: (phone: string, lead?: LeadRecord | null, callerNumber?: string) => Promise<void>;
  /** Dialer page calls this right before it calls makeCall() directly */
  registerCallMeta: (lead: LeadRecord | null, phone: string) => void;

  /** Show "Save as lead?" modal after calling unknown number */
  showSaveAsLead: boolean;
  dismissSaveAsLead: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCallContext(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be inside CallProvider');
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { makeCall, callStatus, phoneStatus } = useWebPhone();

  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);
  const [activePhone, setActivePhone] = useState('');
  const [callInitiatedAt, setCallInitiatedAt] = useState<Date | null>(null);
  const [callAnsweredAt, setCallAnsweredAt] = useState<Date | null>(null);
  const [showSaveAsLead, setShowSaveAsLead] = useState(false);

  const activeLeadRef = useRef<LeadRecord | null>(null);
  const activePhoneRef = useRef('');

  // Track when call becomes active (answered)
  useEffect(() => {
    if (callStatus === 'active' && !callAnsweredAt) {
      setCallAnsweredAt(new Date());
    }
    if (callStatus === 'ended' || callStatus === 'idle') {
      if (callStatus === 'ended') {
        // Unknown number → offer to save as lead
        if (!activeLeadRef.current && activePhoneRef.current) {
          setShowSaveAsLead(true);
        }
      }
      // Reset after a delay so overlay can finish its exit animation
      setTimeout(() => {
        setCallAnsweredAt(null);
        setCallInitiatedAt(null);
        setActiveLead(null);
        setActivePhone('');
        activeLeadRef.current = null;
        activePhoneRef.current = '';
      }, 2000);
    }
    if (callStatus === 'connecting') {
      setCallAnsweredAt(null);
    }
  }, [callStatus, callAnsweredAt]);

  const registerCallMeta = useCallback((lead: LeadRecord | null, phone: string) => {
    setActiveLead(lead);
    setActivePhone(phone);
    setCallInitiatedAt(new Date());
    setCallAnsweredAt(null);
    setShowSaveAsLead(false);
    activeLeadRef.current = lead;
    activePhoneRef.current = phone;
  }, []);

  const startCall = useCallback(async (phone: string, lead?: LeadRecord | null, callerNumber?: string) => {
    const e164 = bestEffortE164(phone);
    if (!e164) {
      toast.error('Invalid phone number');
      return;
    }

    if (phoneStatus !== 'ready') {
      toast.warning('Phone not ready — attempting call anyway');
    }

    if (callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'active' || callStatus === 'held') {
      toast.error('End the current call before starting a new one');
      return;
    }

    let fromNumber = callerNumber;
    if (!fromNumber) {
      // Auto-fetch the user's default purchased number so Telnyx accepts the call
      try {
        const res = await fetch('/api/numbers/list');
        const data = await res.json() as { numbers?: Array<{ phone_number: string; is_default: boolean }> };
        const nums = data.numbers ?? [];
        const defaultNum = nums.find((n) => n.is_default) ?? nums[0];
        fromNumber = defaultNum?.phone_number;
      } catch { /* proceed without — call may be rejected by Telnyx */ }
    }

    if (!fromNumber) {
      toast.warning('No outbound caller ID configured — call may fail');
    }

    registerCallMeta(lead ?? null, e164);
    makeCall(e164, fromNumber);
  }, [registerCallMeta, makeCall, phoneStatus, callStatus]);

  const dismissSaveAsLead = useCallback(() => setShowSaveAsLead(false), []);

  return (
    <CallContext.Provider value={{
      activeLead,
      activePhone,
      callAnsweredAt,
      callInitiatedAt,
      startCall,
      registerCallMeta,
      showSaveAsLead,
      dismissSaveAsLead,
    }}>
      {children}
    </CallContext.Provider>
  );
}
