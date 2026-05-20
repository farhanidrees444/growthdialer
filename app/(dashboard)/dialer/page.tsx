'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import LiveStats from '@/components/dialer/LiveStats';
import LeadQueue from '@/components/dialer/LeadQueue';
import DialerPanel from '@/components/dialer/DialerPanel';
import PhoneStatusBar from '@/components/dialer/PhoneStatusBar';
import UpNextQueue from '@/components/dialer/UpNextQueue';
import CurrentLeadCard from '@/components/dialer/CurrentLeadCard';
import AiInsightsPanel from '@/components/dialer/AiInsightsPanel';
import ManualDialCollapsible from '@/components/dialer/ManualDialCollapsible';
import MicPermissionModal from '@/components/dialer/MicPermissionModal';
import DispositionModal from '@/components/dialer/DispositionModal';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { checkConsentRequired } from '@/lib/compliance/region-detector';
import { isE164 } from '@/lib/phone';
import type { LeadRecord } from '@/components/dialer/LeadCard';
import { Zap, PhoneOff, Trophy, Clock, PhoneCall, CalendarCheck, Sparkles, Keyboard, X as XIcon, PhoneMissed, List, Brain } from 'lucide-react';
import DialModeSegmented from '@/components/dialer/DialModeSegmented';
import { PRODUCT_FEATURES } from '@/lib/constants';

function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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

const DISPOSITION_STATUS_MAP: Record<string, LeadRecord['status']> = {
  // New modal keys
  interested:      'connected',
  callback:        'callback',
  meeting_booked:  'meeting_booked',
  voicemail:       'contacted',
  not_interested:  'not_interested',
  wrong_number:    'wrong_number',
  gatekeeper:      'contacted',
  dnc:             'do_not_call',
};

type MobileSheet = 'queue' | 'intel' | 'mode' | null;

interface PowerSession {
  id: string;
  totalCalls: number;
  connectedCalls: number;
  meetingsBooked: number;
  talkTime: number;
}

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

// ── Power Dial Active Bar ─────────────────────────────────────────────────────
function PowerDialBar({
  session,
  nextLeads,
  onEnd,
}: {
  session: PowerSession;
  nextLeads: LeadRecord[];
  onEnd: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-300">{PRODUCT_FEATURES.POWER_DIAL_NAME} Active · Smart routing enabled</span>
        </div>

        {/* Session counters */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">
            <span className="font-bold text-white">{session.totalCalls}</span> calls
          </span>
          <span className="text-slate-400">
            <span className="font-bold text-white">{session.connectedCalls}</span> connected
          </span>
          <span className="text-slate-400">
            <span className="font-bold text-emerald-300">{session.meetingsBooked}</span> meetings
          </span>
        </div>

        {/* Next up */}
        {nextLeads.length > 0 && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[10px] uppercase tracking-wider text-slate-600">Next:</span>
            {nextLeads.slice(0, 3).map((lead) => (
              <span
                key={lead.id}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {lead.name.split(' ')[0]}
              </span>
            ))}
          </div>
        )}

        {/* End session */}
        <button
          type="button"
          onClick={onEnd}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 sm:ml-auto"
        >
          <PhoneOff className="h-3 w-3" />
          End Session
        </button>
      </div>
    </motion.div>
  );
}

// ── Power Dial Countdown Overlay ──────────────────────────────────────────────
function PowerCountdownOverlay({
  countdown,
  nextLead,
  onSkip,
  onPause,
}: {
  countdown: number;
  nextLead: LeadRecord | null;
  onSkip: () => void;
  onPause: () => void;
}) {
  const pct = ((5 - countdown) / 5) * 100;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.025_282)] px-10 py-8 shadow-2xl shadow-black/60"
      >
        {/* Circular countdown */}
        <div className="relative flex items-center justify-center">
          <svg width={96} height={96} className="-rotate-90">
            <circle cx={48} cy={48} r={r} fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth={5} />
            <circle
              cx={48}
              cy={48}
              r={r}
              fill="none"
              stroke="#10b981"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <span className="absolute text-3xl font-bold text-white">{countdown}</span>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-300">
            {nextLead ? `Calling ${nextLead.name.split(' ')[0]} in…` : 'Next call in…'}
          </p>
          {nextLead && (
            <p className="mt-0.5 text-xs text-slate-500">
              {nextLead.company} · {nextLead.phone}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPause}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Pause <span className="text-slate-600">(Esc)</span>
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500"
          >
            Call Now <span className="text-black/50">(Space)</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Pre-Flight Modal ──────────────────────────────────────────────────────────
function PowerPreFlight({
  queueSize,
  skipAlreadyCalled,
  skipDNC,
  onToggleSkipCalled: setSkipAlreadyCalled,
  onToggleSkipDNC: setSkipDNC,
  onStart,
  onCancel,
}: {
  queueSize: number;
  skipAlreadyCalled: boolean;
  skipDNC: boolean;
  onToggleSkipCalled: (v: boolean) => void;
  onToggleSkipDNC: (v: boolean) => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const estMin = Math.round(queueSize * 1.5);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.025_282)] p-6 shadow-2xl shadow-black/70"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Start {PRODUCT_FEATURES.POWER_DIAL_NAME}</h2>
            <p className="text-xs text-slate-500">Auto-dial with smart routing</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
            <p className="text-2xl font-bold text-white">{queueSize}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Leads in queue</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
            <p className="text-2xl font-bold text-white">~{estMin}m</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Est. duration</p>
          </div>
        </div>

        <div className="mb-5 space-y-2.5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={skipAlreadyCalled}
              onChange={(e) => setSkipAlreadyCalled(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Skip already-called leads</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={skipDNC}
              onChange={(e) => setSkipDNC(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Skip Do Not Call leads</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={queueSize === 0}
            className="flex-[2] rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Session Summary Modal ─────────────────────────────────────────────────────
function SessionSummary({
  summary,
  onClose,
}: {
  summary: PowerSession;
  onClose: () => void;
}) {
  const convRate =
    summary.connectedCalls > 0
      ? ((summary.meetingsBooked / summary.connectedCalls) * 100).toFixed(1)
      : '0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.025_282)] p-6 shadow-2xl shadow-black/70"
      >
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Trophy className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">Session Complete!</h2>
          <p className="mt-1 text-sm text-slate-500">Here's how you did</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
            <PhoneCall className="mx-auto mb-1 h-4 w-4 text-slate-400" />
            <p className="text-2xl font-bold text-white">{summary.totalCalls}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Calls</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
            <PhoneCall className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
            <p className="text-2xl font-bold text-white">{summary.connectedCalls}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Connected</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-3 text-center">
            <CalendarCheck className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-300">{summary.meetingsBooked}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Meetings</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
            <Clock className="mx-auto mb-1 h-4 w-4 text-slate-400" />
            <p className="text-2xl font-bold text-white">{formatDuration(summary.talkTime)}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Talk Time</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <p className="text-xs text-slate-500">Meeting Conversion Rate</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{convRate}%</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}

// ── Main Dialer Content ───────────────────────────────────────────────────────
function DialerContent() {
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();

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

  const { registerCallMeta } = useCallContext();

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
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [purchasedNumbers, setPurchasedNumbers] = useState<
    Array<{ id: string; phone_number: string; is_default: boolean }>
  >([]);
  const [fromNumber, setFromNumber] = useState('');

  // ── Disposition modal ─────────────────────────────────────────────────────────
  const [showDispositionModal, setShowDispositionModal] = useState(false);

  // ── Power dial state ──────────────────────────────────────────────────────────
  const [dialMode, setDialMode] = useState<'manual' | 'power'>('manual');
  const [powerSession, setPowerSession] = useState<PowerSession | null>(null);
  const [powerCountdown, setPowerCountdown] = useState<number | null>(null);
  const [showPowerPreFlight, setShowPowerPreFlight] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<PowerSession | null>(null);
  const [skipAlreadyCalled, setSkipAlreadyCalled] = useState(false);
  const [skipDNC, setSkipDNC] = useState(true);
  const [powerDialIndex, setPowerDialIndex] = useState(0);

  // Refs to avoid closure staleness
  const hasAutoSelectedRef = useRef(false);
  const preselectedLeadId = searchParams?.get('lead_id') ?? null;
  const pendingDialRef = useRef<{ to: string; leadId: string | null }>({ to: '', leadId: null });
  const powerSessionRef = useRef<PowerSession | null>(null);
  const powerDialQueueRef = useRef<LeadRecord[]>([]);
  const powerDialIndexRef = useRef<number>(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track whether the current call was ever answered (reached 'active' state)
  const wasAnsweredRef = useRef(false);
  // Stable refs for async callbacks to avoid stale closures
  const callSidRef = useRef<string | null>(null);
  const dialModeRef = useRef<'manual' | 'power'>('manual');
  const selectedLeadRef = useRef<LeadRecord | null>(null);
  // Forward ref so the callStatus effect can call handleAutoNoAnswer before it's defined
  const handleAutoNoAnswerRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Toast + UI state
  const [noAnswerToast, setNoAnswerToast] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [complianceWarning, setComplianceWarning] = useState<string | null>(null);

  useEffect(() => { powerSessionRef.current = powerSession; }, [powerSession]);
  useEffect(() => { callSidRef.current = callState.callSid; }, [callState.callSid]);
  useEffect(() => { dialModeRef.current = dialMode; }, [dialMode]);
  useEffect(() => { selectedLeadRef.current = selectedLead; }, [selectedLead]);

  // ── Fetch purchased numbers ───────────────────────────────────────────────────
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
          const stored = typeof window !== 'undefined' ? localStorage.getItem('preferred_caller_id') : null;
          const preferred = stored && data.some(n => n.phone_number === stored)
            ? stored
            : (data.find((n) => n.is_default) ?? data[0]).phone_number;
          setFromNumber(preferred);
        }
      });
  }, [supabase]);

  const handleFromNumberChange = useCallback((num: string) => {
    setFromNumber(num);
    try { localStorage.setItem('preferred_caller_id', num); } catch { /* ignore */ }
  }, []);

  // ── Sync WebRTC call status → local callState ─────────────────────────────────
  useEffect(() => {
    // Track whether this call was ever answered
    if (callStatus === 'connecting') wasAnsweredRef.current = false;
    if (callStatus === 'active' || callStatus === 'held') wasAnsweredRef.current = true;

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

      // Keep 'disconnected' until the disposition modal clears it
      if (prev.status === 'disconnected' && newStatus === 'idle') return prev;

      if (prev.status === newStatus && prev.isMuted === isMuted && prev.isOnHold === isOnHold) {
        return prev;
      }
      return { ...prev, status: newStatus, isMuted, isOnHold };
    });

    if (callStatus === 'ended') {
      setHistoryRefreshKey((k) => k + 1);
      if (!wasAnsweredRef.current) {
        // Call never connected — auto-handle silently
        handleAutoNoAnswerRef.current();
      } else {
        setShowDispositionModal(true);
      }
      wasAnsweredRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus, isMuted, isOnHold]);

  // ── Log call to DB when WebRTC gives us a call_control_id ───────────────────
  useEffect(() => {
    const { to, leadId } = pendingDialRef.current;
    if (!activeCallId || !to) return;

    fetch('/api/calls/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        lead_id: leadId,
        call_control_id: activeCallId,
        power_dial_session_id: powerSessionRef.current?.id ?? null,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setCallState((prev) => ({ ...prev, callSid: activeCallId }));
        refreshStats();
      })
      .catch((err) => console.error('[dialer] call log error:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallId]);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    fetch('/api/stats/today')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStats({
            calls: data.callsToday ?? 0,
            connects: data.answeredToday ?? Math.round(((data.callsToday ?? 0) * (data.connectRate ?? 0)) / 100),
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

  // ── Close bottom sheet when a call goes active ───────────────────────────────
  useEffect(() => {
    if (callStatus !== 'idle' && callStatus !== 'ended') setMobileSheet(null);
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
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `telnyx_call_id=eq.${cid}` },
        (payload) => {
          const s = (payload.new as { status?: string })?.status ?? '';
          if (s === 'answered' || s === 'in-progress') {
            setCallState((prev) => prev.status !== 'connected' ? { ...prev, status: 'connected' } : prev);
          } else if (['completed', 'failed', 'busy', 'no-answer'].includes(s)) {
            setCallState((prev) => prev.status !== 'disconnected' ? { ...prev, status: 'disconnected' } : prev);
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
      const SELECT_WITH_DNC =
        'id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url,dnc';
      const SELECT_NO_DNC =
        'id,name,title,company,phone,email,linkedin,ai_score,status,last_called_at,call_attempts,tags,notes,company_size,industry,revenue,activity_summary,profile_url';

      let { data, error: queryError } = await supabase
        .from('leads')
        .select(SELECT_WITH_DNC)
        .order('ai_score', { ascending: false });

      // Gracefully fall back if migration 005 (dnc column) hasn't been run yet
      if (queryError?.message?.includes('dnc')) {
        const fallback = await supabase
          .from('leads')
          .select(SELECT_NO_DNC)
          .order('ai_score', { ascending: false });
        data = fallback.data as typeof data;
        queryError = fallback.error;
      }

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

  // ── Tab counts (computed from all leads, ignoring search) ────────────────────
  const tabCounts = useMemo(() => ({
    queue: leads.filter(
      (l) =>
        !l.dnc &&
        l.status !== 'do_not_call' &&
        (l.status === 'new' ||
          l.status === 'queued' ||
          (l.status === 'contacted' && (l.call_attempts ?? 0) < 3)),
    ).length,
    all: leads.length,
    hot: leads.filter(
      (l) => l.status === 'callback' || l.status === 'meeting_booked' || l.status === 'connected',
    ).length,
  }), [leads]);

  // ── Filtered leads ────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.phone.includes(q),
      );
    }
    if (filterMode === 'Queue')
      list = list.filter(
        (l) =>
          !l.dnc &&
          l.status !== 'do_not_call' &&
          (l.status === 'new' ||
            l.status === 'queued' ||
            (l.status === 'contacted' && (l.call_attempts ?? 0) < 3)),
      );
    if (filterMode === 'Hot Leads')
      list = list.filter(
        (l) => l.status === 'callback' || l.status === 'meeting_booked' || l.status === 'connected',
      );
    return list;
  }, [leads, searchQuery, filterMode]);

  // Power dial queue — respects pre-flight filters
  const powerDialQueue = useMemo(() => {
    return filteredLeads.filter((l) => {
      if (skipDNC && (l.dnc || l.status === 'do_not_call')) return false;
      if (skipAlreadyCalled && l.call_attempts > 0) return false;
      return true;
    });
  }, [filteredLeads, skipDNC, skipAlreadyCalled]);

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

      // Compliance check
      const consent = checkConsentRequired(destination);
      setComplianceWarning(consent.required ? consent.disclaimer : null);

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

      if (lead) {
        const newAttempts = (lead.call_attempts ?? 0) + 1;
        const newStatus = lead.status === 'new' || lead.status === 'queued' ? 'contacted' : lead.status;
        supabase
          .from('leads')
          .update({ call_attempts: newAttempts, last_called_at: new Date().toISOString(), status: newStatus })
          .eq('id', lead.id)
          .then(() => {
            setLeads((prev) =>
              prev.map((l) => l.id === lead.id ? { ...l, call_attempts: newAttempts, status: newStatus as LeadRecord['status'] } : l),
            );
            setSelectedLead((prev) =>
              prev?.id === lead.id ? { ...prev, call_attempts: newAttempts, status: newStatus as LeadRecord['status'] } : prev,
            );
          });
      }

      registerCallMeta(lead ?? null, destination);
      webPhoneMakeCall(destination, fromNumber || undefined);
    },
    [sanitize, countryCode, phoneStatus, micPermission, supabase, webPhoneMakeCall, fromNumber, registerCallMeta],
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

  // ── Power dial helpers ────────────────────────────────────────────────────────
  const stopCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setPowerCountdown(null);
  }, []);

  const advancePowerDial = useCallback(() => {
    stopCountdown();
    const queue = powerDialQueueRef.current;
    const nextIdx = powerDialIndexRef.current;

    if (nextIdx >= queue.length) {
      // No more leads — end session
      const sess = powerSessionRef.current;
      if (sess) {
        fetch(`/api/power-dial/sessions/${sess.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' }),
        }).catch(console.error);
        setSessionSummary(sess);
        setShowSessionSummary(true);
      }
      setPowerSession(null);
      setDialMode('manual');
      return;
    }

    const next = queue[nextIdx];
    powerDialIndexRef.current = nextIdx + 1;
    setPowerDialIndex(nextIdx + 1);

    setSelectedLead(next);
    setNotes(next.notes ?? '');
    setPhoneNumber(next.phone ?? '');
    setCallState(INITIAL_CALL_STATE);

    setTimeout(() => dial(next.phone, next), 250);
  }, [stopCountdown, dial]);

  const startCountdown = useCallback(() => {
    stopCountdown();
    setPowerCountdown(5);
    countdownTimerRef.current = setInterval(() => {
      setPowerCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          advancePowerDial();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopCountdown, advancePowerDial]);

  // ── Auto-no-answer: silently dispositions unanswered calls ───────────────────
  const handleAutoNoAnswer = useCallback(async () => {
    const callSid = callSidRef.current;
    if (callSid) {
      supabase.from('calls').update({ disposition: 'no_answer' })
        .eq('telnyx_call_id', callSid);
    }
    setCallState(INITIAL_CALL_STATE);
    setNoAnswerToast(true);
    setTimeout(() => setNoAnswerToast(false), 5000);
    refreshStats();
    if (dialModeRef.current === 'power') {
      startCountdown();
    }
  }, [supabase, refreshStats, startCountdown]);

  useEffect(() => { handleAutoNoAnswerRef.current = handleAutoNoAnswer; }, [handleAutoNoAnswer]);

  const endPowerDialSession = useCallback(() => {
    stopCountdown();
    const sess = powerSessionRef.current;
    if (sess) {
      fetch(`/api/power-dial/sessions/${sess.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      }).catch(console.error);
      setSessionSummary(sess);
      setShowSessionSummary(true);
    }
    setPowerSession(null);
    setDialMode('manual');
  }, [stopCountdown]);

  const startPowerDialSession = useCallback(async () => {
    setShowPowerPreFlight(false);

    let sessionId = 'local';
    try {
      const res = await fetch('/api/power-dial/sessions', { method: 'POST' });
      const data = await res.json();
      if (data.id) sessionId = data.id;
    } catch (err) {
      console.error('[power-dial] failed to create session:', err);
    }

    const session: PowerSession = {
      id: sessionId,
      totalCalls: 0,
      connectedCalls: 0,
      meetingsBooked: 0,
      talkTime: 0,
    };
    setPowerSession(session);
    powerSessionRef.current = session;
    setDialMode('power');

    // Build queue snapshot
    const queue = powerDialQueue;
    powerDialQueueRef.current = queue;
    powerDialIndexRef.current = 0;
    setPowerDialIndex(0);

    if (queue.length > 0) {
      const first = queue[0];
      powerDialIndexRef.current = 1;
      setPowerDialIndex(1);
      setSelectedLead(first);
      setNotes(first.notes ?? '');
      setPhoneNumber(first.phone ?? '');
      setCallState(INITIAL_CALL_STATE);
      setTimeout(() => dial(first.phone, first), 300);
    } else {
      // Empty queue — end immediately
      endPowerDialSession();
    }
  }, [powerDialQueue, dial, endPowerDialSession]);

  // ── Disposition save ──────────────────────────────────────────────────────────
  const handleDispositionSave = useCallback(
    async (disp: string, dispNotes: string, callbackAt?: string) => {
      if (!selectedLead) return;
      const newStatus = DISPOSITION_STATUS_MAP[disp] ?? selectedLead.status;
      const isDNC = disp === 'dnc';
      const isMeetingBooked = disp === 'meeting_booked';

      const leadUpdates: Record<string, unknown> = {
        status: newStatus,
        last_called_at: new Date().toISOString(),
        notes: dispNotes,
      };
      if (isDNC) leadUpdates.dnc = true;
      if (callbackAt) leadUpdates.next_callback_at = callbackAt;

      await supabase.from('leads').update(leadUpdates).eq('id', selectedLead.id);

      if (callState.callSid) {
        await supabase
          .from('calls')
          .update({
            disposition: disp,
            disposition_notes: dispNotes,
            ...(callbackAt ? { callback_at: callbackAt } : {}),
          })
          .eq('telnyx_call_id', callState.callSid);
      }

      setNotes(dispNotes);
      setLeads((prev) =>
        prev.map((l) => l.id === selectedLead.id ? { ...l, status: newStatus, notes: dispNotes, dnc: isDNC ? true : l.dnc } : l),
      );

      // Update power dial session counters
      if (powerSession) {
        const wasConnected = callState.status === 'connected' || callState.duration > 0;
        const newSession: PowerSession = {
          ...powerSession,
          totalCalls: powerSession.totalCalls + 1,
          connectedCalls: wasConnected ? powerSession.connectedCalls + 1 : powerSession.connectedCalls,
          meetingsBooked: isMeetingBooked ? powerSession.meetingsBooked + 1 : powerSession.meetingsBooked,
          talkTime: powerSession.talkTime + callState.duration,
        };
        setPowerSession(newSession);
        powerSessionRef.current = newSession;
        fetch(`/api/power-dial/sessions/${powerSession.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_calls: newSession.totalCalls,
            connected_calls: newSession.connectedCalls,
            meetings_booked: newSession.meetingsBooked,
            total_talk_time: newSession.talkTime,
          }),
        }).catch(console.error);
      }

      setShowDispositionModal(false);
      setCallState(INITIAL_CALL_STATE);
      refreshStats();

      if (dialMode === 'power') {
        startCountdown();
      } else {
        // Manual: advance to next lead
        setTimeout(() => {
          const idx = leads.findIndex((l) => l.id === selectedLead.id);
          const next = leads[idx + 1] ?? null;
          if (next && next.id !== selectedLead.id) {
            setSelectedLead(next);
            setNotes(next.notes ?? '');
            setPhoneNumber(next.phone ?? '');
          }
        }, 800);
      }
    },
    [selectedLead, callState, powerSession, dialMode, leads, supabase, refreshStats, startCountdown],
  );

  const handleDispositionSkip = useCallback(() => {
    setShowDispositionModal(false);
    setCallState(INITIAL_CALL_STATE);
    if (dialMode === 'power') {
      startCountdown();
    }
  }, [dialMode, startCountdown]);

  const handleMarkDNC = useCallback(async () => {
    if (!selectedLead) return;
    await supabase
      .from('leads')
      .update({ dnc: true, status: 'do_not_call' })
      .eq('id', selectedLead.id);
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, dnc: true, status: 'do_not_call' as const } : l,
      ),
    );
    setSelectedLead((prev) =>
      prev ? { ...prev, dnc: true, status: 'do_not_call' as const } : prev,
    );
    setTimeout(() => {
      const idx = leads.findIndex((l) => l.id === selectedLead.id);
      const next = leads[idx + 1] ?? null;
      if (next) {
        setSelectedLead(next);
        setNotes(next.notes ?? '');
        setPhoneNumber(next.phone ?? '');
      }
    }, 400);
  }, [selectedLead, supabase, leads]);

  const handleMarkHot = useCallback(async () => {
    if (!selectedLead) return;
    const currentTags = selectedLead.tags ?? [];
    const isHot = currentTags.includes('hot');
    const newTags = isHot ? currentTags.filter((t) => t !== 'hot') : [...currentTags, 'hot'];
    await supabase.from('leads').update({ tags: newTags }).eq('id', selectedLead.id);
    const updated = { ...selectedLead, tags: newTags };
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
    setSelectedLead(updated);
  }, [selectedLead, supabase]);

  // ── Lead selection ────────────────────────────────────────────────────────────
  const handleSelectLead = useCallback((lead: LeadRecord) => {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
    setPhoneNumber(lead.phone);
  }, []);

  const handleSelectLeadMobile = useCallback((lead: LeadRecord) => {
    handleSelectLead(lead);
    setMobileSheet(null);
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '?') { e.preventDefault(); setShowShortcutsModal((v) => !v); return; }
      if (e.key === 'Escape') { setShowShortcutsModal(false); }

      // Countdown shortcuts
      if (powerCountdown !== null) {
        if (e.code === 'Space') { e.preventDefault(); advancePowerDial(); }
        if (e.key === 'Escape') { e.preventDefault(); stopCountdown(); }
        if (e.key.toLowerCase() === 'p') { e.preventDefault(); stopCountdown(); }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (callState.status === 'idle') handleDial();
        else if (['connecting', 'ringing', 'connected'].includes(callState.status)) hangUp();
      }
      if (e.key.toLowerCase() === 'm') toggleMute();
      if (e.key.toLowerCase() === 's' && callState.status === 'idle') { e.preventDefault(); handleSkipNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [callState.status, handleDial, hangUp, toggleMute, powerCountdown, advancePowerDial, stopCountdown, handleSkipNext]);

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
    onMarkDNC: handleMarkDNC,
    isReady: phoneStatus === 'ready',
    isRecording,
    error,
    dialMode,
    onStartPowerDial: () => setShowPowerPreFlight(true),
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
    tabCounts,
  };


  // ── Page title ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = `${PRODUCT_FEATURES.DIALER_NAME} | GrowthDialer`;
    return () => { document.title = 'GrowthDialer'; };
  }, []);

  // Next leads preview for power dial bar
  const nextPowerLeads = powerDialQueueRef.current.slice(powerDialIndex, powerDialIndex + 3);
  const nextPowerLead = powerDialQueueRef.current[powerDialIndex] ?? null;

  return (
    <div className="flex-1 overflow-y-auto text-slate-100">
      <MicPermissionModal />

      {/* ── No-answer toast ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {noAnswerToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/[0.10] bg-[oklch(0.12_0.02_282)] px-5 py-3 shadow-xl shadow-black/60"
          >
            <PhoneMissed className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-sm font-semibold text-slate-200">No answer</p>
            <span className="text-xs text-slate-500">
              {dialMode === 'power' ? '· Moving to next lead in 5s' : '· Marked as no answer'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compliance warning banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {complianceWarning && callState.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 flex max-w-md items-start gap-3 rounded-2xl border border-amber-500/30 bg-[oklch(0.10_0.025_282)] px-4 py-3 shadow-xl shadow-black/60"
          >
            <span className="text-amber-400 shrink-0 text-base">⚠️</span>
            <p className="text-xs text-amber-300/90 leading-relaxed">{complianceWarning}</p>
            <button type="button" onClick={() => setComplianceWarning(null)} className="shrink-0 text-slate-600 hover:text-slate-400 ml-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcuts modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcutsModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.025_282)] p-6 shadow-2xl shadow-black/70"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcutsModal(false)}
                  className="rounded-lg p-1 text-slate-500 hover:text-slate-300"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'Space', desc: 'Start call / Hang up' },
                  { key: '1 – 8', desc: 'Quick disposition' },
                  { key: 'M', desc: 'Mute / Unmute' },
                  { key: 'S', desc: 'Skip to next lead (idle)' },
                  { key: 'P', desc: 'Pause countdown (AI Power Dial)' },
                  { key: 'Esc', desc: 'Close modal / pause countdown' },
                  { key: '?', desc: 'Toggle this shortcuts panel' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{desc}</span>
                    <kbd className="rounded-lg border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] text-slate-300">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Disposition Modal ─────────────────────────────────────────────────── */}
      <DispositionModal
        open={showDispositionModal}
        leadName={selectedLead?.name ?? callState.leadName}
        callDuration={callState.duration}
        notes={notes}
        onSave={handleDispositionSave}
        onSkip={handleDispositionSkip}
      />

      {/* ── Power countdown overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {powerCountdown !== null && (
          <PowerCountdownOverlay
            countdown={powerCountdown}
            nextLead={nextPowerLead}
            onSkip={advancePowerDial}
            onPause={stopCountdown}
          />
        )}
      </AnimatePresence>

      {/* ── Pre-flight modal ──────────────────────────────────────────────────── */}
      {showPowerPreFlight && (
        <PowerPreFlight
          queueSize={powerDialQueue.length}
          skipAlreadyCalled={skipAlreadyCalled}
          skipDNC={skipDNC}
          onToggleSkipCalled={setSkipAlreadyCalled}
          onToggleSkipDNC={setSkipDNC}
          onStart={startPowerDialSession}
          onCancel={() => setShowPowerPreFlight(false)}
        />
      )}

      {/* ── Session summary modal ─────────────────────────────────────────────── */}
      {showSessionSummary && sessionSummary && (
        <SessionSummary
          summary={sessionSummary}
          onClose={() => { setShowSessionSummary(false); setSessionSummary(null); }}
        />
      )}

      {/* ── DESKTOP layout (lg+) ──────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <LiveStats
                calls={stats.calls}
                connects={stats.connects}
                meetings={stats.meetings}
                connectRate={stats.connectRate}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                title="Keyboard shortcuts (?)"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-500 transition hover:text-slate-300"
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <PhoneStatusBar />
            </div>
          </div>

          {/* Power dial bar */}
          <AnimatePresence>
            {powerSession && dialMode === 'power' && (
              <PowerDialBar
                session={powerSession}
                nextLeads={nextPowerLeads}
                onEnd={endPowerDialSession}
              />
            )}
          </AnimatePresence>

          <CallingFromCard
            purchasedNumbers={purchasedNumbers}
            fromNumber={fromNumber}
            onFromNumberChange={handleFromNumberChange}
            disabled={callState.status !== 'idle'}
          />

          {/* ── 3-column focused layout ──────────────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-[320px_1fr_300px]">
            <UpNextQueue
              leads={leads}
              selectedLeadId={selectedLead?.id ?? null}
              onSelectLead={handleSelectLead}
              onCallLead={handleCallLead}
            />
            <CurrentLeadCard
              selectedLead={selectedLead}
              callState={callState}
              notes={notes}
              onDial={handleDial}
              onMute={toggleMute}
              onHold={toggleHold}
              onRecord={() => setIsRecording((prev) => !prev)}
              onEndCall={hangUp}
              onSkip={handleSkipNext}
              onMarkHot={handleMarkHot}
              onMarkDNC={handleMarkDNC}
              onSaveNotes={handleSaveNotes}
              isReady={phoneStatus === 'ready'}
              isRecording={isRecording}
              error={error}
            />
            <AiInsightsPanel
              lead={selectedLead}
              notes={notes}
              refreshKey={historyRefreshKey}
            />
          </div>

          {/* ── Bottom row: manual dial + AI Power Dial trigger ──────────── */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <ManualDialCollapsible
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryChange={setCountryCode}
                onPhoneChange={setPhoneNumber}
                onDial={handleDial}
                onDigit={(digit) => setPhoneNumber((prev) => `${prev}${digit}`)}
                onBackspace={() => setPhoneNumber((prev) => prev.slice(0, -1))}
                isReady={phoneStatus === 'ready'}
              />
            </div>
            {dialMode !== 'power' && (
              <button
                type="button"
                onClick={() => setShowPowerPreFlight(true)}
                disabled={phoneStatus !== 'ready' || callState.status !== 'idle'}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-emerald-600/10 px-6 py-3.5 text-sm font-bold text-violet-300 shadow-lg shadow-violet-500/10 transition hover:from-violet-600/30 hover:to-emerald-600/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                Start AI Power Dial
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (< lg) ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden" style={{ minHeight: 'calc(100dvh - 48px)' }}>
        {/* Status bar row */}
        <div className="flex shrink-0 items-center justify-end border-b border-white/[0.06] bg-black/20 px-3 py-1.5">
          <PhoneStatusBar />
        </div>

        {/* Main call panel — always visible on mobile */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-3 p-3">
            {powerSession && dialMode === 'power' && (
              <PowerDialBar session={powerSession} nextLeads={nextPowerLeads} onEnd={endPowerDialSession} />
            )}
            <CallingFromCard
              purchasedNumbers={purchasedNumbers}
              fromNumber={fromNumber}
              onFromNumberChange={handleFromNumberChange}
              disabled={callState.status !== 'idle'}
            />
            <DialerPanel {...dialerPanelProps} />
          </div>
        </div>

        {/* Bottom action bar: Queue | Mode | Intel */}
        <div className="shrink-0 flex border-t border-white/[0.06] bg-[oklch(0.07_0.02_286)]">
          <button
            type="button"
            onClick={() => setMobileSheet('queue')}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-slate-400 transition hover:text-white"
          >
            <List className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Queue</span>
            {tabCounts.queue > 0 && (
              <span className="absolute top-2 right-[calc(50%-16px)] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-[oklch(0.08_0.04_153)]">
                {tabCounts.queue > 99 ? '99+' : tabCounts.queue}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileSheet('mode')}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-3 transition",
              dialMode === 'power' ? "text-violet-400" : "text-slate-400 hover:text-white",
            )}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-semibold capitalize">{dialMode}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSheet('intel')}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-slate-400 transition hover:text-white"
          >
            <Brain className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Intel</span>
          </button>
        </div>
      </div>

      {/* ── Mobile bottom sheets ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSheet !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSheet(null)}
            />
            {/* Sheet panel */}
            <motion.div
              key="sheet-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-white/[0.08] bg-[oklch(0.10_0.025_282)] lg:hidden"
              style={{ maxHeight: '78vh' }}
            >
              {/* Drag handle (visual + tap to close) */}
              <div
                className="flex justify-center pt-3 pb-1 shrink-0 cursor-pointer"
                onClick={() => setMobileSheet(null)}
              >
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>
              {/* Sheet header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <span className="text-sm font-semibold text-white">
                  {mobileSheet === 'queue' ? 'Active Queue' : mobileSheet === 'mode' ? 'Dial Mode' : 'Live Intel'}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSheet(null)}
                  className="rounded-lg p-1 text-slate-500 transition hover:text-slate-300"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              {/* Sheet content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {mobileSheet === 'queue' && (
                  <LeadQueue
                    {...leadQueueProps}
                    onSelectLead={handleSelectLeadMobile}
                    onCallLead={(phone, lead) => { handleCallLead(phone, lead); setMobileSheet(null); }}
                  />
                )}
                {mobileSheet === 'intel' && (
                  <AiInsightsPanel
                    lead={selectedLead}
                    notes={notes}
                    refreshKey={historyRefreshKey}
                  />
                )}
                {mobileSheet === 'mode' && (
                  <div className="space-y-4 pb-4">
                    <DialModeSegmented
                      mode={dialMode === 'power' ? 'power' : 'manual'}
                      onStartPowerDial={() => { setMobileSheet(null); setShowPowerPreFlight(true); }}
                      disabled={phoneStatus !== 'ready' || callState.status !== 'idle'}
                      className="w-full"
                    />
                    <p className="text-center text-xs text-slate-600">
                      {dialMode === 'power'
                        ? 'Power mode active — use "End Session" to stop'
                        : 'Select a mode to start dialing'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
