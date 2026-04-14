'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Plus, ShieldCheck, Wifi } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { useTwilioDevice } from '@/hooks/useTwilioDevice';
import LiveStats from '@/components/dialer/LiveStats';
import LeadQueue from '@/components/dialer/LeadQueue';
import DialerPanel from '@/components/dialer/DialerPanel';
import CoachingSidebar from '@/components/dialer/CoachingSidebar';
import type { LeadRecord } from '@/components/dialer/LeadCard';

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

const initialLead: LeadRecord = {
  id: 'empty',
  name: 'No lead selected',
  title: 'Select a prospect from the queue',
  company: '',
  phone: '',
  email: '',
  linkedin: '',
  ai_score: 0,
  status: 'new',
  last_called_at: '',
  call_attempts: 0,
};

export default function DialerPage() {
  const [supabase] = useState(() => createClient());
  const session = useSupabaseSession();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'Queue' | 'All Leads' | 'Hot Leads'>('Queue');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('Connected');
  const [callbackTime, setCallbackTime] = useState('');
  const [parallelLines, setParallelLines] = useState(3);
  const [dialMode, setDialMode] = useState<'Power' | 'Parallel' | 'Preview'>('Power');
  const [isRecording, setIsRecording] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [identity, setIdentity] = useState('agent-1');
  const [stats, setStats] = useState({ calls: 0, connects: 0, meetings: 0, connectRate: 0 });
  const hasAutoSelectedRef = useRef(false);

  const { device, callState, connection, isReady, error, initDevice, makeCall, hangUp, toggleMute, toggleHold, sendDigits } = useTwilioDevice();

  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter((lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.phone.includes(query)
      );
    }
    if (filterMode === 'Queue') {
      list = list.filter((lead) => lead.status === 'new' || lead.status === 'contacted');
    }
    if (filterMode === 'Hot Leads') {
      list = list.filter((lead) => lead.ai_score >= 75 || lead.status === 'qualified' || lead.status === 'meeting_booked');
    }
    return list;
  }, [leads, searchQuery, filterMode]);

  const leadCountText = `${filteredLeads.length} / ${leads.length} leads`;

  const playTone = useCallback((frequency: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.value = 0.08;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (e) {
      // Audio failed silently
    }
  }, []);

  useEffect(() => {
    const loadLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url')
        .order('call_attempts', { ascending: true });

      if (error) {
        console.error('Supabase load leads error:', error.message);
        return;
      }

      const normalized = ((data ?? []) as LeadRecord[]).map((lead) => ({
        ...lead,
        call_attempts: lead.call_attempts ?? 0,
        ai_score: lead.ai_score ?? 0,
      }));

      setLeads(normalized);
      // Auto-select only on the very first load — using a ref avoids adding
      // selectedLead to deps which would cause an infinite re-render loop.
      if (!hasAutoSelectedRef.current && normalized.length > 0) {
        hasAutoSelectedRef.current = true;
        setSelectedLead(normalized[0]);
        setNotes(normalized[0].notes ?? '');
      }
    };

    loadLeads();

    const channel = supabase
      .channel('leads-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]); // selectedLead intentionally excluded — use hasAutoSelectedRef instead

  useEffect(() => {
    const calls = leads.reduce((sum, lead) => sum + (lead.call_attempts ?? 0), 0);
    const connects = leads.filter((lead) => ['connected', 'qualified', 'meeting_booked'].includes(lead.status)).length;
    const meetings = leads.filter((lead) => lead.status === 'meeting_booked').length;
    const connectRate = calls ? (connects / Math.max(calls, 1)) * 100 : 0;

    setStats({ calls, connects, meetings, connectRate });
  }, [leads]);

  useEffect(() => {
    if (callState.status === 'connecting') {
      playTone(480);
    }
    if (callState.status === 'connected') {
      playTone(660);
      setIsConnected(true);
    }
    if (callState.status === 'disconnected') {
      playTone(280);
      setIsConnected(false);
    }
  }, [callState.status, playTone]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (callState.status === 'idle') {
          handleDial();
        } else {
          hangUp();
        }
      }
      if (event.key.toLowerCase() === 'm') {
        toggleMute();
      }
      if (event.key.toLowerCase() === 'n') {
        setIsNotesOpen(true);
      }
      if (event.key === 'Escape') {
        setIsNotesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // handleDial must be included so the closure captures fresh phoneNumber/selectedLead/session
  }, [callState.status, hangUp, toggleMute, handleDial]);

  const handleConnectDevice = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const freshIdentity = session?.user?.email ?? `agent-${Date.now()}`;
      setIdentity(freshIdentity);
      await initDevice(freshIdentity);
    } catch (error) {
      console.error('Microphone permission error:', error);
    }
  };

  const sanitizeNumber = useCallback((raw: string) => raw.replace(/[^\d+]/g, ''), []);

  const handleDial = useCallback(async () => {
    const raw = sanitizeNumber(phoneNumber);
    const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
    if (!destination) return;
    await makeCall({
      toNumber: destination,
      leadId: selectedLead?.id,
      leadName: selectedLead?.name,
      userId: session?.user?.id,
    });
  }, [sanitizeNumber, phoneNumber, countryCode, makeCall, selectedLead, session]);

  const handleCallLead = async (phone: string, lead?: LeadRecord) => {
    const raw = sanitizeNumber(phone);
    const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
    setPhoneNumber(raw);
    if (lead) {
      setSelectedLead(lead);
      setNotes(lead.notes ?? '');
    }
    await makeCall({
      toNumber: destination,
      leadId: lead?.id,
      leadName: lead?.name,
      userId: session?.user?.id,
    });
  };

  const handleSelectLead = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
    setPhoneNumber(lead.phone);
  };

  const reorderLeads = (draggedId: string, targetId: string) => {
    setLeads((prev) => {
      const newList = [...prev];
      const draggedIndex = newList.findIndex((lead) => lead.id === draggedId);
      const targetIndex = newList.findIndex((lead) => lead.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const [dragged] = newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, dragged);
      return newList;
    });
  };

  const handleSaveNotes = async (value: string) => {
    setNotes(value);
    if (!selectedLead) return;
    setLeads((prev) => prev.map((lead) => (lead.id === selectedLead.id ? { ...lead, notes: value } : lead)));
    await supabase.from('leads').update({ notes: value }).eq('id', selectedLead.id);
  };

  const handleSchedule = async (value: string) => {
    setCallbackTime(value);
    if (!selectedLead) return;
    await supabase.from('leads').update({ next_callback_at: value }).eq('id', selectedLead.id);
  };

  const handleSaveAndNext = async () => {
    if (!selectedLead) return;
    // Save notes + callback to leads; disposition belongs on the calls table
    await supabase
      .from('leads')
      .update({ notes, next_callback_at: callbackTime })
      .eq('id', selectedLead.id);
    // If there's an active call SID, record the outcome on the calls row
    if (callState.callSid) {
      await supabase
        .from('calls')
        .update({ outcome: disposition })
        .eq('twilio_call_sid', callState.callSid);
    }
    const nextIndex = leads.findIndex((lead) => lead.id === selectedLead.id) + 1;
    const nextLead = leads[nextIndex] ?? leads[0] ?? null;
    setSelectedLead(nextLead);
    setNotes(nextLead?.notes ?? '');
    setPhoneNumber(nextLead?.phone ?? '');
  };

  const lineStatus = useMemo(() => {
    const labels = ['James W.', 'Priya N.', 'Marcus W.', 'Sarah C.', 'Empty'];
    return Array.from({ length: parallelLines }, (_, index) => {
      const status = index === 0 ? 'ringing' : index === 1 ? 'connected' : index === 2 ? 'no-answer' : index === 3 ? 'voicemail' : 'idle';
      return {
        id: index + 1,
        label: labels[index] ?? `Line ${index + 1}`,
        status,
        timer: status === 'idle' ? '00:00' : `00:0${index + 2}`,
      };
    });
  }, [parallelLines]);

  const currentLead = selectedLead ?? initialLead;

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      <div className="mx-auto flex max-w-[1640px] flex-col gap-6 px-6 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <LiveStats
            calls={stats.calls}
            connects={stats.connects}
            meetings={stats.meetings}
            connectRate={stats.connectRate}
            isReady={isReady}
            dnd={false}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleConnectDevice}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ShieldCheck className="h-4 w-4" /> Connect Device
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-3 text-sm text-slate-200 transition hover:border-emerald-400/30"
            >
              <Search className="h-4 w-4" /> Search
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-3 text-sm text-slate-200 transition hover:border-emerald-400/30"
            >
              <Bell className="h-4 w-4" /> Notifications
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_1.7fr_320px]">
          <LeadQueue
            leads={filteredLeads}
            selectedLeadId={selectedLead?.id ?? null}
            filterMode={filterMode}
            onFilterChange={setFilterMode}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectLead={handleSelectLead}
            onCallLead={(phone) => handleCallLead(phone)}
            onReorder={reorderLeads}
            leadCount={leadCountText}
          />

          <DialerPanel
            selectedLead={currentLead}
            phoneNumber={phoneNumber}
            countryCode={countryCode}
            dialMode={dialMode}
            parallelLines={parallelLines}
            callState={callState}
            notes={notes}
            notesOpen={isNotesOpen}
            disposition={disposition}
            lines={lineStatus}
            onCountryChange={setCountryCode}
            onPhoneChange={setPhoneNumber}
            onDigit={(digit) => {
              if (callState.status === 'connected') {
                sendDigits(digit);
              } else {
                setPhoneNumber((prev) => `${prev}${digit}`);
              }
            }}
            onBackspace={() => setPhoneNumber((prev) => prev.slice(0, -1))}
            onDial={handleDial}
            onMute={toggleMute}
            onHold={toggleHold}
            onTransfer={() => playTone(520)}
            onRecord={() => setIsRecording((prev) => !prev)}
            onNotes={() => setIsNotesOpen((prev) => !prev)}
            onNextLead={() => {
              const nextIndex = leads.findIndex((lead) => lead.id === selectedLead?.id) + 1;
              const nextLead = leads[nextIndex] ?? leads[0] ?? null;
              setSelectedLead(nextLead);
              setNotes(nextLead?.notes ?? '');
              setPhoneNumber(nextLead?.phone ?? '');
            }}
            onEndCall={hangUp}
            onSaveNotes={handleSaveNotes}
            onDispositionChange={setDisposition}
            onSchedule={handleSchedule}
            onSaveAndNext={handleSaveAndNext}
            isReady={isReady}
            isRecording={isRecording}
            error={error}
            onSetDialMode={setDialMode}
            onSetParallelLines={setParallelLines}
          />

          <CoachingSidebar
            leadName={currentLead.name}
            companyName={currentLead.company}
            companySize={currentLead.company_size ?? 'Medium'}
            industry={currentLead.industry ?? 'Technology'}
            revenue={currentLead.revenue ?? '$25M'}
            activity={currentLead.activity_summary ?? 'Opened 3 emails, visited pricing page.'}
            profileUrl={currentLead.profile_url}
            notes={currentLead.notes ?? 'No notes yet.'}
          />
        </div>
      </div>
    </div>
  );
}
