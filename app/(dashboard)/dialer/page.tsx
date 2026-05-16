'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

const DISPOSITION_STATUS_MAP: Record<string, string> = {
  'Meeting Booked': 'meeting_booked',
  'Not Interested': 'not_interested',
  Callback: 'callback',
  'Wrong Number': 'wrong_number',
  Voicemail: 'contacted',
  'No Answer': 'contacted',
  Connected: 'connected',
};

function DialerContent() {
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'Queue' | 'All Leads' | 'Hot Leads'>('Queue');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stats, setStats] = useState({ calls: 0, connects: 0, meetings: 0, connectRate: 0 });
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const hasAutoSelectedRef = useRef(false);
  const preselectedLeadId = searchParams?.get('lead_id') ?? null;

  // ── Stats ───────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    fetch('/api/stats/today')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStats({
            calls: data.callsToday ?? 0,
            connects:
              data.answeredToday ??
              Math.round(((data.callsToday ?? 0) * (data.connectRate ?? 0)) / 100),
            meetings: data.meetingsBooked ?? 0,
            connectRate: data.connectRate ?? 0,
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // ── Call duration timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (callState.status !== 'connected') return;
    const timer = setInterval(
      () => setCallState((prev) => ({ ...prev, duration: prev.duration + 1 })),
      1000,
    );
    return () => clearInterval(timer);
  }, [callState.status]);

  // ── Poll call status (2s interval while active) ─────────────────────────────
  useEffect(() => {
    const cid = callState.callSid;
    if (!cid || callState.status === 'idle' || callState.status === 'disconnected') return;

    const poll = async () => {
      const { data } = await supabase
        .from('calls')
        .select('status')
        .eq('telnyx_call_id', cid)
        .maybeSingle();
      if (!data) return;
      const s = (data as { status: string }).status;
      if (s === 'answered' || s === 'in-progress') {
        setCallState((prev) => (prev.status !== 'connected' ? { ...prev, status: 'connected' } : prev));
      } else if (s === 'completed' || s === 'failed' || s === 'no-answer' || s === 'busy') {
        setCallState((prev) =>
          prev.status !== 'disconnected' ? { ...prev, status: 'disconnected' } : prev,
        );
        setHistoryRefreshKey((k) => k + 1);
      }
    };

    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [callState.callSid, callState.status, supabase]);

  // ── Supabase realtime for call status ───────────────────────────────────────
  useEffect(() => {
    if (!callState.callSid) return;
    const channel = supabase
      .channel(`call-${callState.callSid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `telnyx_call_id=eq.${callState.callSid}`,
        },
        (payload) => {
          const s = (payload.new as { status?: string })?.status ?? '';
          if (s === 'answered' || s === 'in-progress') {
            setCallState((prev) => ({ ...prev, status: 'connected' }));
          } else if (s === 'completed' || s === 'failed' || s === 'busy' || s === 'no-answer') {
            setCallState((prev) => ({ ...prev, status: 'disconnected' }));
            setHistoryRefreshKey((k) => k + 1);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [callState.callSid, supabase]);

  // ── Load leads ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadLeads = async () => {
      const { data, error: queryError } = await supabase
        .from('leads')
        .select(
          'id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url',
        )
        .order('ai_score', { ascending: false });

      if (queryError) {
        console.error('Load leads error:', queryError.message);
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
        const preselected = preselectedLeadId
          ? (normalized.find((l) => l.id === preselectedLeadId) ?? normalized[0])
          : normalized[0];
        setSelectedLead(preselected);
        setPhoneNumber(preselected.phone ?? '');
        setNotes(preselected.notes ?? '');
      }
    };

    loadLeads();

    const channel = supabase
      .channel('leads-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () =>
        loadLeads(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // ── Filtered leads ──────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    if (filterMode === 'Queue')
      list = list.filter(
        (l) => l.status === 'new' || l.status === 'contacted' || l.status === 'queued',
      );
    if (filterMode === 'Hot Leads')
      list = list.filter(
        (l) => l.ai_score >= 75 || l.status === 'connected' || l.status === 'meeting_booked',
      );
    return list;
  }, [leads, searchQuery, filterMode]);

  // ── Core dial function ──────────────────────────────────────────────────────
  const sanitize = useCallback((raw: string) => raw.replace(/[^\d+]/g, ''), []);

  const dial = useCallback(
    async (phone: string, lead?: LeadRecord | null) => {
      const raw = sanitize(phone);
      const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
      if (!destination || destination === countryCode) return;

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

      if (lead) {
        const newAttempts = (lead.call_attempts ?? 0) + 1;
        const newStatus =
          lead.status === 'new' || lead.status === 'queued' ? 'contacted' : lead.status;
        supabase
          .from('leads')
          .update({
            call_attempts: newAttempts,
            last_called_at: new Date().toISOString(),
            status: newStatus,
          })
          .eq('id', lead.id)
          .then(() => {
            setLeads((prev) =>
              prev.map((l) =>
                l.id === lead.id
                  ? {
                      ...l,
                      call_attempts: newAttempts,
                      status: newStatus as LeadRecord['status'],
                    }
                  : l,
              ),
            );
            setSelectedLead((prev) =>
              prev?.id === lead.id
                ? { ...prev, call_attempts: newAttempts, status: newStatus as LeadRecord['status'] }
                : prev,
            );
          });
      }

      try {
        const res = await fetch('/api/calls/dial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: destination, lead_id: lead?.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Call could not be connected');
        setCallState((prev) => ({
          ...prev,
          status: 'ringing',
          callSid: data.call_control_id ?? null,
        }));
        refreshStats();
      } catch (err) {
        setCallState(INITIAL_CALL_STATE);
        setError(err instanceof Error ? err.message : 'Call could not be connected. Try again.');
      }
    },
    [sanitize, countryCode, supabase, refreshStats],
  );

  const handleDial = useCallback(
    () => dial(phoneNumber, selectedLead),
    [dial, phoneNumber, selectedLead],
  );

  const handleCallLead = useCallback(
    (phone: string, lead: LeadRecord) => {
      setPhoneNumber(phone);
      setSelectedLead(lead);
      setNotes(lead.notes ?? '');
      dial(phone, lead);
    },
    [dial],
  );

  const hangUp = useCallback(async () => {
    const cid = callState.callSid;
    // Stay 'disconnected' so DispositionPanel is shown — reset happens in handleDisposition
    setCallState((prev) => ({ ...prev, status: 'disconnected' }));
    setHistoryRefreshKey((k) => k + 1);
    if (cid) {
      fetch('/api/calls/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: cid }),
      }).catch(console.error);
    }
  }, [callState.callSid]);

  const toggleMute = useCallback(
    () => setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted })),
    [],
  );
  const toggleHold = useCallback(
    () => setCallState((prev) => ({ ...prev, isOnHold: !prev.isOnHold })),
    [],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (callState.status === 'idle') handleDial();
        else if (['connecting', 'ringing', 'connected'].includes(callState.status)) hangUp();
      }
      if (e.key.toLowerCase() === 'm') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [callState.status, handleDial, hangUp, toggleMute]);

  // ── Lead selection ──────────────────────────────────────────────────────────
  const handleSelectLead = useCallback((lead: LeadRecord) => {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
    setPhoneNumber(lead.phone);
  }, []);

  const handleSkipNext = useCallback(() => {
    const idx = leads.findIndex((l) => l.id === selectedLead?.id);
    const next = leads[idx + 1] ?? leads[0] ?? null;
    if (next) {
      setSelectedLead(next);
      setNotes(next.notes ?? '');
      setPhoneNumber(next.phone ?? '');
    }
  }, [leads, selectedLead]);

  const reorderLeads = useCallback((draggedId: string, targetId: string) => {
    setLeads((prev) => {
      const list = [...prev];
      const from = list.findIndex((l) => l.id === draggedId);
      const to = list.findIndex((l) => l.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return list;
    });
  }, []);

  // ── Notes ───────────────────────────────────────────────────────────────────
  const handleSaveNotes = useCallback(
    async (value: string) => {
      setNotes(value);
      if (!selectedLead) return;
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: value } : l)),
      );
      await supabase.from('leads').update({ notes: value }).eq('id', selectedLead.id);
    },
    [selectedLead, supabase],
  );

  // ── Disposition ─────────────────────────────────────────────────────────────
  const handleDisposition = useCallback(
    async (disp: string, localNotes: string, callbackAt?: string) => {
      if (!selectedLead) return;
      const newStatus =
        (DISPOSITION_STATUS_MAP[disp] as LeadRecord['status']) ?? selectedLead.status;

      const updates: Record<string, unknown> = {
        status: newStatus,
        last_called_at: new Date().toISOString(),
        notes: localNotes,
      };
      if (callbackAt) updates.next_callback_at = callbackAt;

      await supabase.from('leads').update(updates).eq('id', selectedLead.id);

      if (callState.callSid) {
        await supabase
          .from('calls')
          .update({ disposition: disp, notes: localNotes })
          .eq('telnyx_call_id', callState.callSid);
      }

      setNotes(localNotes);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: newStatus, notes: localNotes } : l,
        ),
      );

      setTimeout(() => {
        const idx = leads.findIndex((l) => l.id === selectedLead.id);
        const next = leads[idx + 1] ?? leads[0] ?? null;
        if (next && next.id !== selectedLead.id) {
          setSelectedLead(next);
          setNotes(next.notes ?? '');
          setPhoneNumber(next.phone ?? '');
        }
        setCallState(INITIAL_CALL_STATE);
        refreshStats();
      }, 1500);
    },
    [selectedLead, callState.callSid, leads, supabase, refreshStats],
  );

  return (
    <div className="flex-1 overflow-y-auto text-slate-100">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-6 py-6">
        <LiveStats
          calls={stats.calls}
          connects={stats.connects}
          meetings={stats.meetings}
          connectRate={stats.connectRate}
        />

        <div className="grid gap-5 xl:grid-cols-[280px_1fr_300px]">
          <LeadQueue
            leads={filteredLeads}
            selectedLeadId={selectedLead?.id ?? null}
            filterMode={filterMode}
            onFilterChange={setFilterMode}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectLead={handleSelectLead}
            onCallLead={handleCallLead}
            onReorder={reorderLeads}
            onSkipNext={handleSkipNext}
            leadCount={`${filteredLeads.length} / ${leads.length}`}
          />

          <DialerPanel
            selectedLead={selectedLead}
            phoneNumber={phoneNumber}
            countryCode={countryCode}
            callState={callState}
            notes={notes}
            onCountryChange={setCountryCode}
            onPhoneChange={setPhoneNumber}
            onDigit={(digit) => setPhoneNumber((prev) => `${prev}${digit}`)}
            onBackspace={() => setPhoneNumber((prev) => prev.slice(0, -1))}
            onDial={handleDial}
            onMute={toggleMute}
            onHold={toggleHold}
            onRecord={() => setIsRecording((prev) => !prev)}
            onNextLead={handleSkipNext}
            onEndCall={hangUp}
            onSaveNotes={handleSaveNotes}
            onDisposition={handleDisposition}
            isReady={true}
            isRecording={isRecording}
            error={error}
          />

          <CoachingSidebar
            lead={selectedLead}
            notes={notes}
            onSaveNotes={handleSaveNotes}
            refreshKey={historyRefreshKey}
          />
        </div>
      </div>
    </div>
  );
}

export default function DialerPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <DialerContent />
    </Suspense>
  );
}
