'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import LiveStats from '@/components/dialer/LiveStats';
import LeadQueue from '@/components/dialer/LeadQueue';
import DialerPanel from '@/components/dialer/DialerPanel';
import CoachingSidebar from '@/components/dialer/CoachingSidebar';
import PhoneStatusBar from '@/components/dialer/PhoneStatusBar';
import MicPermissionModal from '@/components/dialer/MicPermissionModal';
import { WebPhoneProvider, useWebPhone } from '@/contexts/webphone-context';
import { isE164 } from '@/lib/phone';
import type { LeadRecord } from '@/components/dialer/LeadCard';

function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

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

type MobileTab = 'queue' | 'call' | 'history';

function MobileStatStrip({ calls, connects, meetings, connectRate }: {
  calls: number; connects: number; meetings: number; connectRate: number;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-none shrink-0 border-b border-white/[0.06]">
      {[
        { label: 'Calls', value: calls },
        { label: 'Connects', value: connects },
        { label: 'Meetings', value: meetings },
        { label: 'Rate', value: `${connectRate.toFixed(1)}%` },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
          <span className="text-sm font-bold text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}

function CallingFromCard({
  purchasedNumbers,
  fromNumber,
  onFromNumberChange,
  disabled,
}: {
  purchasedNumbers: Array<{ id: string; phone_number: string; is_default: boolean }>;
  fromNumber: string;
  onFromNumberChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5 shadow-sm shadow-emerald-500/5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
          Calling From
        </span>
        {purchasedNumbers.length === 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">No number configured —</span>
            <a
              href="/numbers"
              className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Buy a number →
            </a>
          </div>
        ) : purchasedNumbers.length === 1 ? (
          <span className="font-mono text-sm font-semibold text-white">
            {formatPhone(purchasedNumbers[0].phone_number)}{purchasedNumbers[0].is_default ? ' ⭐' : ''}
          </span>
        ) : (
          <select
            value={fromNumber}
            onChange={(e) => onFromNumberChange(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-white/[0.10] bg-[oklch(0.10_0.025_282)] px-3 py-1.5 font-mono text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-60"
          >
            {purchasedNumbers.map((n) => (
              <option
                key={n.id}
                value={n.phone_number}
                style={{ backgroundColor: 'oklch(0.10 0.025 282)' }}
              >
                {formatPhone(n.phone_number)}{n.is_default ? ' ⭐' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function DialerContent() {
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();

  // ── WebRTC phone ─────────────────────────────────────────────────────────────
  const {
    phoneStatus,
    callStatus,
    activeCallId,
    isMuted,
    isOnHold,
    micPermission,
    makeCall: webPhoneMakeCall,
    hangup: webPhoneHangup,
    toggleMute,
    toggleHold,
  } = useWebPhone();

  // ── UI state ─────────────────────────────────────────────────────────────────
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
  const [mobileTab, setMobileTab] = useState<MobileTab>('call');
  const [purchasedNumbers, setPurchasedNumbers] = useState<
    Array<{ id: string; phone_number: string; is_default: boolean }>
  >([]);
  const [fromNumber, setFromNumber] = useState('');
  const hasAutoSelectedRef = useRef(false);
  const preselectedLeadId = searchParams?.get('lead_id') ?? null;

  // Store the pending dial target so we can log it once we have call_control_id
  const pendingDialRef = useRef<{ to: string; leadId: string | null }>({ to: '', leadId: null });

  // ── Fetch user's purchased numbers ───────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('purchased_numbers')
      .select('id, phone_number, is_default')
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .then(({ data, error: qErr }) => {
        if (qErr) { console.error('[dialer] purchased_numbers fetch error:', qErr); return; }
        if (data && data.length > 0) {
          setPurchasedNumbers(data as Array<{ id: string; phone_number: string; is_default: boolean }>);
          const defaultNum = data.find((n) => n.is_default) ?? data[0];
          setFromNumber(defaultNum.phone_number);
        }
      });
  }, [supabase]);

  // ── Sync WebRTC call status → local callState ────────────────────────────────
  useEffect(() => {
    setCallState((prev) => {
      const statusMap: Record<typeof callStatus, CallState['status']> = {
        idle: 'idle',
        connecting: 'connecting',
        ringing: 'ringing',
        active: 'connected',
        held: 'connected',
        ended: 'disconnected',
      };
      const newStatus = statusMap[callStatus] ?? 'idle';
      // Don't overwrite lead info or duration — only update the status + mute/hold
      if (prev.status === newStatus && prev.isMuted === isMuted && prev.isOnHold === isOnHold) {
        return prev;
      }
      return { ...prev, status: newStatus, isMuted, isOnHold };
    });

    if (callStatus === 'ended') {
      setHistoryRefreshKey((k) => k + 1);
    }
  }, [callStatus, isMuted, isOnHold]);

  // ── Log call to DB when WebRTC gives us a call_control_id ───────────────────
  useEffect(() => {
    const { to, leadId } = pendingDialRef.current;
    if (!activeCallId || !to) return;

    // Create the DB record with the call_control_id from WebRTC
    fetch('/api/calls/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, lead_id: leadId, call_control_id: activeCallId }),
    })
      .then((r) => r.json())
      .then(() => {
        setCallState((prev) => ({ ...prev, callSid: activeCallId }));
        refreshStats();
      })
      .catch((err) => console.error('[dialer] call log error:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallId]);

  // ── Stats ────────────────────────────────────────────────────────────────────
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

  // ── Auto-switch mobile tab when call goes active ──────────────────────────────
  useEffect(() => {
    if (callStatus !== 'idle' && callStatus !== 'ended') {
      setMobileTab('call');
    }
  }, [callStatus]);

  // ── Call duration timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (callState.status !== 'connected') return;
    const timer = setInterval(
      () => setCallState((prev) => ({ ...prev, duration: prev.duration + 1 })),
      1000,
    );
    return () => clearInterval(timer);
  }, [callState.status]);

  // ── Supabase realtime for call status ─────────────────────────────────────────
  useEffect(() => {
    if (!callState.callSid) return;
    const cid = callState.callSid;
    const channel = supabase
      .channel(`call-${cid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `telnyx_call_id=eq.${cid}`,
        },
        (payload) => {
          const s = (payload.new as { status?: string })?.status ?? '';
          if (s === 'answered' || s === 'in-progress') {
            setCallState((prev) => (prev.status !== 'connected' ? { ...prev, status: 'connected' } : prev));
          } else if (s === 'completed' || s === 'failed' || s === 'busy' || s === 'no-answer') {
            setCallState((prev) => (prev.status !== 'disconnected' ? { ...prev, status: 'disconnected' } : prev));
            setHistoryRefreshKey((k) => k + 1);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [callState.callSid, supabase]);

  // ── Load leads ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadLeads = async () => {
      const { data, error: queryError } = await supabase
        .from('leads')
        .select(
          'id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url',
        )
        .order('ai_score', { ascending: false });

      if (queryError) { console.error('Load leads error:', queryError.message); return; }

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // ── Filtered leads ────────────────────────────────────────────────────────────
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
      list = list.filter((l) => l.status === 'new' || l.status === 'contacted' || l.status === 'queued');
    if (filterMode === 'Hot Leads')
      list = list.filter((l) => l.ai_score >= 75 || l.status === 'connected' || l.status === 'meeting_booked');
    return list;
  }, [leads, searchQuery, filterMode]);

  // ── Core dial function ────────────────────────────────────────────────────────
  const sanitize = useCallback((raw: string) => raw.replace(/[^\d+]/g, ''), []);

  const dial = useCallback(
    (phone: string, lead?: LeadRecord | null) => {
      const raw = sanitize(phone);
      const destination = raw.startsWith('+') ? raw : `${countryCode}${raw}`;
      if (!destination || destination === countryCode) return;

      if (phoneStatus !== 'ready') {
        setError('Phone is not ready yet — please wait a moment and try again.');
        return;
      }
      if (micPermission === 'denied') {
        setError('Microphone access is blocked. Please enable it in your browser settings.');
        return;
      }

      if (fromNumber && !isE164(fromNumber)) {
        setError('Invalid "From" number — please select a valid purchased number.');
        return;
      }

      console.log('[DIALER] Initiating call:', { from: fromNumber || '(none)', to: destination });

      // Store for later logging when activeCallId arrives
      pendingDialRef.current = { to: destination, leadId: lead?.id ?? null };

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

      // Update lead stats optimistically
      if (lead) {
        const newAttempts = (lead.call_attempts ?? 0) + 1;
        const newStatus = lead.status === 'new' || lead.status === 'queued' ? 'contacted' : lead.status;
        supabase
          .from('leads')
          .update({ call_attempts: newAttempts, last_called_at: new Date().toISOString(), status: newStatus })
          .eq('id', lead.id)
          .then(() => {
            setLeads((prev) =>
              prev.map((l) =>
                l.id === lead.id
                  ? { ...l, call_attempts: newAttempts, status: newStatus as LeadRecord['status'] }
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

      // Initiate WebRTC call — audio flows browser ↔ destination
      webPhoneMakeCall(destination, fromNumber || undefined);
    },
    [sanitize, countryCode, phoneStatus, micPermission, supabase, webPhoneMakeCall, fromNumber],
  );

  const handleDial = useCallback(() => dial(phoneNumber, selectedLead), [dial, phoneNumber, selectedLead]);

  const handleCallLead = useCallback(
    (phone: string, lead: LeadRecord) => {
      setPhoneNumber(phone);
      setSelectedLead(lead);
      setNotes(lead.notes ?? '');
      dial(phone, lead);
    },
    [dial],
  );

  const hangUp = useCallback(() => {
    webPhoneHangup();
    setHistoryRefreshKey((k) => k + 1);
  }, [webPhoneHangup]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
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

  // ── Lead selection ────────────────────────────────────────────────────────────
  const handleSelectLead = useCallback((lead: LeadRecord) => {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
    setPhoneNumber(lead.phone);
  }, []);

  const handleSelectLeadMobile = useCallback((lead: LeadRecord) => {
    handleSelectLead(lead);
    setMobileTab('call');
  }, [handleSelectLead]);

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

  // ── Notes ─────────────────────────────────────────────────────────────────────
  const handleSaveNotes = useCallback(
    async (value: string) => {
      setNotes(value);
      if (!selectedLead) return;
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: value } : l)));
      await supabase.from('leads').update({ notes: value }).eq('id', selectedLead.id);
    },
    [selectedLead, supabase],
  );

  // ── Disposition ───────────────────────────────────────────────────────────────
  const handleDisposition = useCallback(
    async (disp: string, localNotes: string, callbackAt?: string) => {
      if (!selectedLead) return;
      const newStatus = (DISPOSITION_STATUS_MAP[disp] as LeadRecord['status']) ?? selectedLead.status;

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
        prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus, notes: localNotes } : l)),
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

  // ── Shared props ──────────────────────────────────────────────────────────────
  const dialerPanelProps = {
    selectedLead,
    phoneNumber,
    countryCode,
    callState,
    notes,
    onCountryChange: setCountryCode,
    onPhoneChange: setPhoneNumber,
    onDigit: (digit: string) => setPhoneNumber((prev) => `${prev}${digit}`),
    onBackspace: () => setPhoneNumber((prev) => prev.slice(0, -1)),
    onDial: handleDial,
    onMute: toggleMute,
    onHold: toggleHold,
    onRecord: () => setIsRecording((prev) => !prev),
    onNextLead: handleSkipNext,
    onEndCall: hangUp,
    onSaveNotes: handleSaveNotes,
    onDisposition: handleDisposition,
    isReady: phoneStatus === 'ready',
    isRecording,
    error,
  };

  const leadQueueProps = {
    leads: filteredLeads,
    selectedLeadId: selectedLead?.id ?? null,
    filterMode,
    onFilterChange: setFilterMode,
    searchValue: searchQuery,
    onSearchChange: setSearchQuery,
    onReorder: reorderLeads,
    onSkipNext: handleSkipNext,
    leadCount: `${filteredLeads.length} / ${leads.length}`,
  };

  const mobileTabs: { key: MobileTab; label: string }[] = [
    { key: 'queue', label: 'Queue' },
    { key: 'call', label: 'Call' },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="flex-1 overflow-y-auto text-slate-100">
      {/* Mic permission gate — shows modal on first visit */}
      <MicPermissionModal />

      {/* ── DESKTOP layout (lg+) ──────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-6 py-6">
          {/* Stats + phone status */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <LiveStats
                calls={stats.calls}
                connects={stats.connects}
                meetings={stats.meetings}
                connectRate={stats.connectRate}
              />
            </div>
            <PhoneStatusBar />
          </div>

          {/* Calling From */}
          <CallingFromCard
            purchasedNumbers={purchasedNumbers}
            fromNumber={fromNumber}
            onFromNumberChange={setFromNumber}
            disabled={callState.status !== 'idle'}
          />

          <div className="grid gap-5 xl:grid-cols-[280px_1fr_300px]">
            <LeadQueue
              {...leadQueueProps}
              onSelectLead={handleSelectLead}
              onCallLead={handleCallLead}
            />
            <DialerPanel {...dialerPanelProps} />
            <CoachingSidebar
              lead={selectedLead}
              notes={notes}
              onSaveNotes={handleSaveNotes}
              refreshKey={historyRefreshKey}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (< lg) ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden" style={{ minHeight: 'calc(100vh - 57px)' }}>
        <MobileStatStrip
          calls={stats.calls}
          connects={stats.connects}
          meetings={stats.meetings}
          connectRate={stats.connectRate}
        />

        {/* Phone status + tab bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-black/20 px-3">
          <div className="flex flex-1">
            {mobileTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMobileTab(key)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                  mobileTab === key
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-2 shrink-0">
            <PhoneStatusBar />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'queue' && (
            <div className="p-3">
              <LeadQueue
                {...leadQueueProps}
                onSelectLead={handleSelectLeadMobile}
                onCallLead={(phone, lead) => {
                  handleCallLead(phone, lead);
                  setMobileTab('call');
                }}
              />
            </div>
          )}
          {mobileTab === 'call' && (
            <div className="space-y-3 p-3">
              <CallingFromCard
                purchasedNumbers={purchasedNumbers}
                fromNumber={fromNumber}
                onFromNumberChange={setFromNumber}
                disabled={callState.status !== 'idle'}
              />
              <DialerPanel {...dialerPanelProps} />
            </div>
          )}
          {mobileTab === 'history' && (
            <div className="p-3">
              <CoachingSidebar
                lead={selectedLead}
                notes={notes}
                onSaveNotes={handleSaveNotes}
                refreshKey={historyRefreshKey}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DialerPage() {
  return (
    <WebPhoneProvider>
      <Suspense fallback={<div className="flex-1" />}>
        <DialerContent />
      </Suspense>
    </WebPhoneProvider>
  );
}
