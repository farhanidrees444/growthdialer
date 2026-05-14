import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Linkedin, ChevronRight, Sparkles, ClipboardList, RotateCcw } from 'lucide-react';
import ManualDialer from '@/components/dialer/ManualDialer';
import CallControls from '@/components/dialer/CallControls';
import CallTimer from '@/components/dialer/CallTimer';
import AudioVisualizer from '@/components/dialer/AudioVisualizer';
import ParallelLines from '@/components/dialer/ParallelLines';
import DispositionPanel from '@/components/dialer/DispositionPanel';
import { LeadRecord } from '@/components/dialer/LeadCard';

interface DialerPanelProps {
  selectedLead: LeadRecord | null;
  phoneNumber: string;
  countryCode: string;
  dialMode: 'Power' | 'Parallel' | 'Preview';
  parallelLines: number;
  callState: {
    status: string;
    direction: 'inbound' | 'outbound' | null;
    callSid: string | null;
    duration: number;
    isMuted: boolean;
    isOnHold: boolean;
    leadId: string | null;
    leadName: string | null;
  };
  notes: string;
  notesOpen: boolean;
  disposition: string;
  lines: Array<{ id: number; label: string; status: string; timer: string }>;
  onCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDial: () => void;
  onMute: () => void;
  onHold: () => void;
  onTransfer: () => void;
  onRecord: () => void;
  onNotes: () => void;
  onNextLead: () => void;
  onEndCall: () => void;
  onSaveNotes: (value: string) => void;
  onDispositionChange: (value: string) => void;
  onSchedule: (value: string) => void;
  onSaveAndNext: () => void;
  isReady: boolean;
  isRecording: boolean;
  error?: string | null;
  onSetDialMode: (mode: 'Power' | 'Parallel' | 'Preview') => void;
  onSetParallelLines: (count: number) => void;
}

export default function DialerPanel({ selectedLead, phoneNumber, countryCode, dialMode, parallelLines, callState, notes, notesOpen, disposition, lines, onCountryChange, onPhoneChange, onDigit, onBackspace, onDial, onMute, onHold, onTransfer, onRecord, onNotes, onNextLead, onEndCall, onSaveNotes, onDispositionChange, onSchedule, onSaveAndNext, isReady, isRecording, error, onSetDialMode, onSetParallelLines }: DialerPanelProps) {
  const leadDisplay = selectedLead ?? {
    id: 'empty',
    name: 'No lead selected',
    title: 'Select a prospect from the queue',
    company: '',
    phone: '',
    email: '',
    linkedin: '',
    ai_score: 0,
    status: 'new' as const,
    last_called_at: '',
    call_attempts: 0,
    notes: '',
    company_size: 'Medium',
    industry: 'Technology',
    revenue: '$25M',
    activity_summary: 'No activity recorded.',
    profile_url: '#',
    tags: ['High Priority', 'B2B', 'Referral'],
  };

  const tags = selectedLead?.tags ?? leadDisplay.tags;
  const history = [
    {
      label: 'Last action',
      date: selectedLead?.last_called_at ? new Date(selectedLead.last_called_at).toLocaleDateString() : 'No record',
      result: selectedLead?.status.replace('_', ' ') ?? 'Idle',
      accent: 'emerald',
    },
    {
      label: 'Next step',
      date: 'Today',
      result: disposition,
      accent: disposition === 'Connected' ? 'emerald' : 'amber',
    },
  ];
  const scoreHue = leadDisplay.ai_score > 80 ? 'from-emerald-500 to-teal-400' : leadDisplay.ai_score > 50 ? 'from-sky-500 to-indigo-500' : 'from-slate-500 to-slate-700';
  const activeCall = ['connecting', 'ringing', 'connected'].includes(callState.status);
  const dispositionVisible = activeCall || notesOpen;
  const summary = useMemo(() => {
    return selectedLead ? selectedLead.company : 'No company data available';
  }, [selectedLead]);

  return (
    <section className="flex-1 rounded-[40px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_0_50px_rgba(0,255,102,0.08)] backdrop-blur-xl">
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Now dialing</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{leadDisplay.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{leadDisplay.title} • {leadDisplay.company}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${scoreHue} text-white shadow-[0_0_30px_rgba(0,255,102,0.2)]`}>
                  <span className="text-xl font-semibold">{leadDisplay.ai_score}</span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                <p className="font-semibold text-rose-100">Call device error</p>
                <p className="mt-1 text-slate-200">{error}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-500">Score</span>
                  <span className="text-lg font-semibold text-white">AI readiness</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={`tel:${leadDisplay.phone}`} className="rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white transition hover:border-emerald-400/30">
                <span className="block text-slate-400">Phone</span>
                <span className="mt-1 block text-base font-semibold">{leadDisplay.phone || 'Not available'}</span>
              </a>
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white">
                <span className="block text-slate-400">Contact</span>
                <div className="mt-1 flex items-center gap-3">
                  <a href={`mailto:${selectedLead?.email ?? '#'}`} className="text-slate-200 transition hover:text-emerald-300">Email</a>
                  <a href={selectedLead?.linkedin ?? '#'} target="_blank" rel="noreferrer" className="text-slate-200 transition hover:text-emerald-300">LinkedIn</a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">{tag}</span>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {history.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm text-white">{item.date}</p>
                  <p className={`mt-3 text-sm font-semibold ${item.accent === 'emerald' ? 'text-emerald-300' : item.accent === 'amber' ? 'text-amber-300' : 'text-slate-400'}`}>{item.result}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <ManualDialer
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryChange={onCountryChange}
              onPhoneChange={onPhoneChange}
              onDial={onDial}
              onDigit={onDigit}
              onBackspace={onBackspace}
              isReady={isReady}
            />

            <div className="space-y-5">
              <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Dial mode</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{dialMode} dialing</h3>
                  </div>
                  <div className="px-3 py-2 rounded-3xl bg-emerald-500/10 text-emerald-300">Lines {parallelLines}</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(['Power', 'Parallel', 'Preview'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`rounded-3xl px-3 py-3 text-sm font-semibold transition ${dialMode === mode ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/20' : 'bg-slate-950/70 text-slate-300 hover:bg-slate-900'}`}
                      onClick={() => onSetDialMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`rounded-3xl px-3 py-3 text-sm font-semibold transition ${parallelLines === count ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/20' : 'bg-slate-950/70 text-slate-300 hover:bg-slate-900'}`}
                      onClick={() => onSetParallelLines(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Call status</p>
                <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                  <span className="rounded-full bg-white/5 px-3 py-2 text-slate-200">{statusLabel(callState.status)}</span>
                  <span className="rounded-full bg-slate-800 px-3 py-2 text-slate-400">{selectedLead ? selectedLead.status.replace('_', ' ') : 'Idle'}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Current prospect profile: {summary}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Call intelligence</p>
                <p className="mt-2 text-lg font-semibold text-white">Live coaching</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-300">AI</span>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl border border-rose-400/15 bg-rose-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-rose-300">Objection detected</p>
                <p className="mt-2 text-sm text-white">Price concern — acknowledge value and ask for budget range.</p>
              </div>
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-300">Buying signal</p>
                <p className="mt-2 text-sm text-white">Asked about timeline — move toward next steps.</p>
              </div>
              <div className="rounded-3xl border border-sky-400/15 bg-sky-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-sky-300">Suggestion</p>
                <p className="mt-2 text-sm text-white">Ask about their current tool and what they like/dislike.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Battlecards</p>
                <p className="mt-2 text-lg font-semibold text-white">Objection handling</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {['We already have a solution', 'Send me an email', 'No budget'].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item}</p>
                    <ChevronRight className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Use this response to keep the call moving and uncover urgency.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeCall && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.6fr]">
            <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
              <CallTimer duration={callState.duration} status={callState.status === 'connected' ? 'Connected' : 'Ringing'} quality={87} />
            </div>
            <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
              <AudioVisualizer active={callState.status === 'connected'} />
              <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Contact</span>
                  <span className="text-white">{leadDisplay.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-slate-400">
                  <span>Phone</span>
                  <span className="text-white">{leadDisplay.phone || '—'}</span>
                </div>
              </div>
            </div>
          </div>
          <CallControls
            isMuted={callState.isMuted}
            isOnHold={callState.isOnHold}
            isRecording={isRecording}
            onMute={onMute}
            onHold={onHold}
            onTransfer={onTransfer}
            onRecord={onRecord}
            onNotes={onNotes}
            onNext={onNextLead}
            onEnd={onEndCall}
          />
        </div>
      )}

      {dispositionVisible && (
        <div className="mt-5">
          <DispositionPanel
            disposition={disposition}
            notes={notes}
            onDispositionChange={onDispositionChange}
            onSaveNotes={onSaveNotes}
            onSchedule={onSchedule}
            onSaveAndNext={onSaveAndNext}
          />
        </div>
      )}

      <div className="mt-5">
        <ParallelLines lines={lines} />
      </div>
    </section>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case 'connecting':
      return 'Connecting...';
    case 'ringing':
      return 'Ringing';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Call ended';
    default:
      return 'Idle';
  }
}
