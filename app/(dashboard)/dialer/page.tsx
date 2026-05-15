'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
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

const INITIAL_CALL_STATE: CallState = {
  status: 'idle',
  direction: null,
  callSid: null,
  duration: 0,
  isMuted: false,
  isOnHold: false,
  leadId: null,
  leadName: null,
};

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
  const [stats, setStats] = useState({ calls: 0, connects: 0, meetings: 0, connectRate: 0 });
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // ── Duration timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState.status !== 'connected') return;
    const timer = setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [callState.status]);

  // ── Subscribe to call status changes from Telnyx webhook ────────────────────
  useEffect(() => {
    if (!callState.callSid) return;
    const channel = supabase
      .channel(`call-status-${callState.callSid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `telnyx_call_id=eq.${callState.callSid}` },
        (payload) => {
          const status = (payload.new as { status?: string })?.status;
          if (status === 'answered') {
            setCallState((prev) => ({ ...prev, status: 'connected' }));
          } else if (status === 'completed') {
            setCallState((prev) => ({ ...prev, status: 'disconnected' }));
            setTimeout(() => setCallState((prev) => ({ ...prev, status: 'idle', callSid: null, duration: 0 })), 2000);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [callState.callSid, supabase]);

  // ── Load leads ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadLeads = async () => {
      const { data, error: queryError } = await supabase
        .from('leads')
        .select('id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url')
        .order('call_attempts', { ascending: true });

      if (queryError) {
        console.error('Supabase load leads error:', queryError.message);
        return;
      }

      const normalized = ((data ?? []) as LeadRecord[]).map((lead) => ({
        ...lead,
        call_attempts: lead.call_attempts ?? 0,
        ai_score: lead.ai_score ?? 0,
      }));

      setLeads(normalized);
      if (!hasAutoSelectedRef.current && normalized.length > 0) {
        hasAutoSelectedRef.current = true;
        setSelectedLead(normalized[0]);
        setNotes(normalized[0].notes ?? '');
      }
    };

    loadLeads();

    const channel = supabase
      .channel('leads-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => { loadLeads(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // ── Stats derived from leads ─────────────────────────────────────────────────
  useEffect(() => {
    const calls = leads.reduce((sum, lead) => sum + (lead.call_attempts ?? 0), 0);
    const connects = leads.filter((lead) => ['connected', 'qualified', 'meeting_booked'].includes(lead.status)).length;
    const meetings = leads.filter((lead) => lead.status === 'meeting_booked').length;
    setStats({ calls, connects, meetings, connectRate: calls ? (connects / Math.max(calls, 1)) * 100 : 0 });
  }, [leads]);

  // ── Filtered leads ───────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.phone.includes(q));
    }
    if (filterMode === 'Queue') list = list.filter((l) => l.status === 'new' || l.status === 'contacted');
    if (filterMode === 'Hot Leads') list = list.filter((l) => l.ai_score >= 75 || l.status === 'qualified' || l.status === 'meeting_booked');
    return list;
  }, [leads, searchQuery, filterMode]);

  // ── Server-side dial via Telnyx API ─────────────────────────────────────────
  const sanitizeNumber = useCallback((raw: string) => raw.replace(/[^\d+]/g, ''), []);

  const handleDial = useCallback(async () => {
    const raw = sanitizeNumber(phoneNumber);
    const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
    if (!destination) return;

    setCallState({
      status: 'connecting',
      direction: 'outbound',
      callSid: null,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      leadId: selectedLead?.id ?? null,
      leadName: selectedLead?.name ?? null,
    });
    setError(null);

    try {
      const res = await fetch('/api/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: destination, lead_id: selectedLead?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to dial');
      setCallState((prev) => ({ ...prev, status: 'ringing', callSid: data.call_control_id ?? null }));
    } catch (err) {
      setCallState(INITIAL_CALL_STATE);
      setError(err instanceof Error ? err.message : 'Call failed');
    }
  }, [sanitizeNumber, phoneNumber, countryCode, selectedLead]);

  const hangUp = useCallback(async () => {
    const cid = callState.callSid;
    setCallState((prev) => ({ ...prev, status: 'disconnected' }));
    if (cid) {
      fetch('/api/calls/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: cid }),
      }).catch(console.error);
    }
    setTimeout(() => setCallState((prev) => ({ ...prev, status: 'idle', callSid: null, duration: 0 })), 1500);
  }, [callState.callSid]);

  const toggleMute = useCallback(() => setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted })), []);
  const toggleHold = useCallback(() => setCallState((prev) => ({ ...prev, isOnHold: !prev.isOnHold })), []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (callState.status === 'idle') { handleDial(); } else { hangUp(); }
      }
      if (event.key.toLowerCase() === 'm') toggleMute();
      if (event.key.toLowerCase() === 'n') setIsNotesOpen(true);
      if (event.key === 'Escape') setIsNotesOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState.status, hangUp, toggleMute, handleDial]);

  // ── Lead actions ─────────────────────────────────────────────────────────────
  const handleCallLead = useCallback(async (phone: string, lead?: LeadRecord) => {
    const raw = sanitizeNumber(phone);
    const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
    setPhoneNumber(raw);
    if (lead) { setSelectedLead(lead); setNotes(lead.notes ?? ''); }

    setCallState({
      status: 'connecting',
      direction: 'outbound',
      callSid: null,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      leadId: lead?.id ?? null,
      leadName: lead?.name ?? null,
    });
    setError(null);

    try {
      const res = await fetch('/api/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: destination, lead_id: lead?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to dial');
      setCallState((prev) => ({ ...prev, status: 'ringing', callSid: data.call_control_id ?? null }));
    } catch (err) {
      setCallState(INITIAL_CALL_STATE);
      setError(err instanceof Error ? err.message : 'Call failed');
    }
  }, [sanitizeNumber, countryCode]);

  const handleSelectLead = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
    setPhoneNumber(lead.phone);
  };

  const reorderLeads = (draggedId: string, targetId: string) => {
    setLeads((prev) => {
      const list = [...prev];
      const from = list.findIndex((l) => l.id === draggedId);
      const to = list.findIndex((l) => l.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return list;
    });
  };

  const handleSaveNotes = async (value: string) => {
    setNotes(value);
    if (!selectedLead) return;
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: value } : l)));
    await supabase.from('leads').update({ notes: value }).eq('id', selectedLead.id);
  };

  const handleSchedule = async (value: string) => {
    setCallbackTime(value);
    if (!selectedLead) return;
    await supabase.from('leads').update({ next_callback_at: value }).eq('id', selectedLead.id);
  };

  const handleSaveAndNext = async () => {
    if (!selectedLead) return;
    await supabase.from('leads').update({ notes, next_callback_at: callbackTime }).eq('id', selectedLead.id);
    if (callState.callSid) {
      await supabase.from('calls').update({ disposition }).eq('telnyx_call_id', callState.callSid);
    }
    const nextIndex = leads.findIndex((l) => l.id === selectedLead.id) + 1;
    const next = leads[nextIndex] ?? leads[0] ?? null;
    setSelectedLead(next);
    setNotes(next?.notes ?? '');
    setPhoneNumber(next?.phone ?? '');
  };

  const lineStatus = useMemo(() => {
    const labels = ['James W.', 'Priya N.', 'Marcus W.', 'Sarah C.', 'Empty'];
    return Array.from({ length: parallelLines }, (_, index) => ({
      id: index + 1,
      label: labels[index] ?? `Line ${index + 1}`,
      status: (index === 0 ? 'ringing' : index === 1 ? 'connected' : index === 2 ? 'no-answer' : index === 3 ? 'voicemail' : 'idle') as 'ringing' | 'connected' | 'no-answer' | 'voicemail' | 'idle',
      timer: index === 0 ? '00:00' : `00:0${index + 2}`,
    }));
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
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            leadCount={`${filteredLeads.length} / ${leads.length} leads`}
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
            onDigit={(digit) => setPhoneNumber((prev) => `${prev}${digit}`)}
            onBackspace={() => setPhoneNumber((prev) => prev.slice(0, -1))}
            onDial={handleDial}
            onMute={toggleMute}
            onHold={toggleHold}
            onTransfer={() => {}}
            onRecord={() => setIsRecording((prev) => !prev)}
            onNotes={() => setIsNotesOpen((prev) => !prev)}
            onNextLead={() => {
              const next = leads[leads.findIndex((l) => l.id === selectedLead?.id) + 1] ?? leads[0] ?? null;
              setSelectedLead(next);
              setNotes(next?.notes ?? '');
              setPhoneNumber(next?.phone ?? '');
            }}
            onEndCall={hangUp}
            onSaveNotes={handleSaveNotes}
            onDispositionChange={setDisposition}
            onSchedule={handleSchedule}
            onSaveAndNext={handleSaveAndNext}
            isReady={true}
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
