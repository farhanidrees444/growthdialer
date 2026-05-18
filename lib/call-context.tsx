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
import { useWebPhone } from '@/contexts/webphone-context';
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

  /** Start a call from anywhere (leads page, etc.) */
  startCall: (phone: string, lead?: LeadRecord | null, callerNumber?: string) => void;
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
  const { makeCall, callStatus } = useWebPhone();

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

  const startCall = useCallback((phone: string, lead?: LeadRecord | null, callerNumber?: string) => {
    registerCallMeta(lead ?? null, phone);
    makeCall(phone, callerNumber);
  }, [registerCallMeta, makeCall]);

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
