import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Brain, CheckCircle2, Mic, Phone, PhoneOff, ShieldCheck, Sparkles, Voicemail, Zap } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

/* ── Browser chrome frame ─────────────────────────────── */
export function BrowserFrame({
  children,
  url = 'app.growthdialer.com',
  badge,
  className,
  caption = 'Illustrative product preview with sample data.',
}: {
  children: ReactNode;
  url?: string;
  badge?: ReactNode;
  className?: string;
  caption?: string | null;
}) {
  return (
    <figure className={cn('not-prose', className)}>
      <div className="pm-browser">
        <div className="pm-browser-bar">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-zinc-300" />
            <span className="h-3 w-3 rounded-full bg-zinc-300" />
            <span className="h-3 w-3 rounded-full bg-zinc-300" />
          </div>
          <span className="mx-auto hidden items-center gap-2 rounded-full bg-zinc-950/[0.04] px-4 py-1 font-mono text-[11.5px] text-zinc-500 sm:inline-flex">
            {url}
          </span>
          <div className="ml-auto sm:ml-0">{badge}</div>
        </div>
        <div className="bg-white">{children}</div>
      </div>
      {caption && <figcaption className="pm-caption">{caption}</figcaption>}
    </figure>
  );
}

export function LiveBadge({ label = 'Live call · AI listening' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-[11.5px] font-semibold text-emerald-700">
      <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

/* ── Animated waveform (CSS only) ─────────────────────── */
export function Waveform({ bars = 40, color = '#6d28d9', className }: { bars?: number; color?: string; className?: string }) {
  return (
    <div className={cn('flex h-10 items-center gap-[3px]', className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="pm-wave-bar w-[3px] rounded-full"
          style={{
            height: `${28 + Math.abs(Math.sin(i * 1.7)) * 72}%`,
            background: color,
            opacity: 0.35 + Math.abs(Math.sin(i * 2.3)) * 0.65,
            animationDelay: `${(i % 12) * 0.12}s`,
            animationDuration: `${1.2 + (i % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── HERO: dialer command console ─────────────────────── */
export function DialerConsole() {
  const queue = [
    { name: 'VP Sales', role: 'Enterprise · Outbound', state: 'active' },
    { name: 'Sales Manager', role: 'Mid-market · Outbound', state: 'queued' },
    { name: 'SDR', role: 'SMB · Outbound', state: 'queued' },
    { name: 'Account Executive', role: 'Enterprise · Follow-up', state: 'done' },
  ];
  return (
    <div className="grid md:grid-cols-[240px_1fr_260px]">
      {/* queue */}
      <div className="hidden border-r border-zinc-950/[0.06] bg-zinc-50/60 p-4 md:block">
        <p className="px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Up next · 4</p>
        <div className="mt-3 space-y-2">
          {queue.map((q) => (
            <div
              key={q.name}
              className={cn(
                'rounded-xl border p-3',
                q.state === 'active'
                  ? 'border-[#6d28d9]/25 bg-white shadow-[0_4px_16px_-8px_rgba(109,40,217,0.35)]'
                  : 'border-zinc-950/[0.05] bg-white/60'
              )}
            >
              <p className="truncate text-[13px] font-semibold text-zinc-900">{q.name}</p>
              <p className="truncate text-[11.5px] text-zinc-500">{q.role}</p>
              <p className={cn(
                'mt-1.5 text-[10.5px] font-semibold uppercase tracking-wider',
                q.state === 'active' ? 'text-[#6d28d9]' : q.state === 'done' ? 'text-emerald-600' : 'text-zinc-400'
              )}>
                {q.state === 'active' ? 'On call' : q.state === 'done' ? 'Done ✓' : 'Queued'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* active call */}
      <div className="p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
            <Phone className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-zinc-950">VP Sales · Enterprise</p>
            <p className="text-[12.5px] text-zinc-500">Connected · Recording on · Line 1 of 5</p>
          </div>
          <p className="font-mono text-[26px] font-semibold tabular-nums text-zinc-950">03:18</p>
        </div>
        <div className="mt-4 rounded-2xl bg-zinc-950/[0.03] px-4 py-3">
          <Waveform bars={52} />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2.5">
          {['Mute', 'Hold', 'Transfer'].map((a) => (
            <span key={a} className="rounded-full border border-zinc-950/[0.08] bg-white px-4 py-2 text-[12.5px] font-medium text-zinc-600">
              {a}
            </span>
          ))}
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.6)]">
            <PhoneOff className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {['Connected', 'Voicemail', 'Not interested'].map((d, i) => (
            <span
              key={d}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-center text-[12.5px] font-semibold',
                i === 0
                  ? 'border-[#6d28d9]/30 bg-[#6d28d9]/[0.07] text-[#6d28d9]'
                  : 'border-zinc-950/[0.07] bg-white text-zinc-600'
              )}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* AI brief */}
      <div className="border-t border-zinc-950/[0.06] bg-zinc-50/60 p-4 md:border-l md:border-t-0">
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-[#6d28d9]" /> AI brief · live
        </p>
        <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-zinc-700">
          <li className="rounded-xl bg-white p-3 shadow-sm">Asked for team pricing and onboarding timeline.</li>
          <li className="rounded-xl bg-white p-3 shadow-sm">
            <span className="font-semibold text-emerald-700">Buying signal:</span> replacing spreadsheet call tracking.
          </li>
          <li className="rounded-xl bg-white p-3 shadow-sm">
            <span className="font-semibold text-zinc-900">Next step:</span> send 12-seat annual proposal.
          </li>
        </ul>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-600/15 bg-emerald-50/70 px-3 py-2.5">
          <Brain className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[12px] font-medium text-emerald-800">Positive intent · pricing discussed</p>
        </div>
      </div>
    </div>
  );
}

/* ── Parallel dialing: five live legs ────────────────── */
export function ParallelDial() {
  const legs = [
    { name: 'VP Sales', status: 'Ringing', tone: 'zinc', icon: Phone },
    { name: 'Sales Manager', status: 'Voicemail · dropped', tone: 'amber', icon: Voicemail },
    { name: 'SDR', status: 'Connected · you’re talking', tone: 'emerald', icon: Mic },
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-zinc-900">Parallel session · 5 lines</p>
        <span className="pm-chip !text-[11px]"><Zap className="h-3 w-3 text-[#6d28d9]" /> AMD active</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {legs.map((leg) => (
          <div
            key={leg.name}
            className={cn(
              'rounded-2xl border p-4',
              leg.tone === 'emerald' && 'border-emerald-600/25 bg-emerald-50/50',
              leg.tone === 'amber' && 'border-amber-500/25 bg-amber-50/50',
              leg.tone === 'zinc' && 'border-zinc-950/[0.07] bg-zinc-50/70'
            )}
          >
            <span className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              leg.tone === 'emerald' && 'bg-emerald-500/15 text-emerald-700',
              leg.tone === 'amber' && 'bg-amber-500/15 text-amber-700',
              leg.tone === 'zinc' && 'bg-zinc-950/[0.05] text-zinc-500'
            )}>
              <leg.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold text-zinc-900">{leg.name}</p>
            <p className={cn(
              'mt-0.5 text-[12px] font-medium',
              leg.tone === 'emerald' && 'text-emerald-700',
              leg.tone === 'amber' && 'text-amber-700',
              leg.tone === 'zinc' && 'text-zinc-500'
            )}>
              {leg.status}
            </p>
            {leg.tone === 'zinc' && <Waveform bars={18} color="#a1a1aa" className="mt-2 h-6" />}
          </div>
        ))}
      </div>
      <p className="pm-small mt-4 text-center">Answering machine detected on line 2 — your voicemail was dropped automatically. You only talk to humans.</p>
    </div>
  );
}

/* ── AI call brief card ───────────────────────────────── */
export function AiBrief() {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
          <Sparkles className="h-4 w-4 text-[#6d28d9]" /> Call brief · ready 8s after hang-up
        </p>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Positive</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {[
          ['Summary', 'Prospect compared us against their spreadsheet workflow. Wants pricing for 12 seats and a 2-week onboarding plan.'],
          ['Objection', '“We tried a dialer before — reps hated the admin.” → Answered: dispositions take one click, notes write themselves.'],
          ['Next step', 'Send annual proposal for 12 seats by Thursday. Owner: rep.'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-zinc-950/[0.06] bg-zinc-50/70 p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{k}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-700">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-950 p-3.5 text-white">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
        <p className="text-[12.5px]">Synced to CRM · logged on the lead timeline with recording attached.</p>
      </div>
    </div>
  );
}

/* ── Number health ────────────────────────────────────── */
export function NumberHealth() {
  const nums = [
    { n: '+1 (415) 555-0132', score: 92, label: 'Excellent' },
    { n: '+1 (415) 555-0184', score: 78, label: 'Good' },
    { n: '+1 (212) 555-0119', score: 41, label: 'At risk' },
  ];
  return (
    <div className="p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
        <ShieldCheck className="h-4 w-4 text-[#6d28d9]" /> Number health
      </p>
      <div className="mt-4 space-y-3">
        {nums.map((x) => (
          <div key={x.n} className="rounded-xl border border-zinc-950/[0.06] bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[13px] font-medium text-zinc-900">{x.n}</p>
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                x.score > 80 && 'bg-emerald-500/10 text-emerald-700',
                x.score <= 80 && x.score > 60 && 'bg-amber-500/10 text-amber-700',
                x.score <= 60 && 'bg-red-500/10 text-red-700'
              )}>
                {x.score} · {x.label}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-950/[0.07]">
              <div
                className={cn('h-full rounded-full', x.score > 80 ? 'bg-emerald-500' : x.score > 60 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${x.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="pm-small mt-4">Spam-risk and carrier reputation scored continuously. Rotate before carriers decide for you.</p>
    </div>
  );
}

/* ── Analytics snapshot ───────────────────────────────── */
export function AnalyticsSnap() {
  const days = [
    { d: 'M', v: 34 }, { d: 'T', v: 52 }, { d: 'W', v: 47 }, { d: 'T', v: 66 }, { d: 'F', v: 58 }, { d: 'S', v: 22 }, { d: 'S', v: 18 },
  ];
  const kpis = [
    { label: 'Connect rate', value: '31%', delta: '+4.2', up: true },
    { label: 'Talk time / rep', value: '3h 12m', delta: '+18m', up: true },
    { label: 'Meetings booked', value: '47', delta: '+9', up: true },
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-zinc-950/[0.06] bg-zinc-50/70 p-3.5">
            <p className="pm-stat-num !text-[1.4rem] sm:!text-[1.7rem]">{k.value}</p>
            <p className="pm-stat-label !mt-1.5 !text-[10px]">{k.label}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
              {k.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {k.delta}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Connects per day</p>
      {/* NOTE: the inner bar-track wrapper has a definite height (flex-1 of the
          stretched h-28 column) so the percentage bar heights resolve. A bare %
          height against an auto-height column collapses to zero. */}
      <div className="mt-2 flex h-28 items-stretch gap-2">
        {days.map((x, i) => (
          <div key={`${x.d}-${i}`} className="flex flex-1 flex-col items-center">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-[#6d28d9]/25 to-[#6d28d9]"
                style={{ height: `${x.v}%` }}
              />
            </div>
            <span className="mt-1.5 text-[10px] font-medium text-zinc-400">{x.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Transcript stream ────────────────────────────────── */
export function TranscriptStream() {
  const lines = [
    { who: 'Rep', text: 'What would make switching dialers worth it for your team?' },
    { who: 'Buyer', text: 'Honestly? If my reps stop complaining about admin work.' },
    { who: 'AI', text: 'Pain confirmed: admin burden · Intent: positive', ai: true },
  ];
  return (
    <div className="space-y-2.5 p-5 sm:p-6">
      {lines.map((l, i) => (
        <Reveal key={l.text} delay={i * 160}>
        <div
          className={cn(
            'rounded-2xl border p-3.5',
            l.ai ? 'border-[#6d28d9]/20 bg-[#6d28d9]/[0.05]' : 'border-zinc-950/[0.06] bg-zinc-50/70'
          )}
        >
          <p className={cn(
            'text-[10.5px] font-semibold uppercase tracking-[0.14em]',
            l.ai ? 'text-[#6d28d9]' : 'text-zinc-400'
          )}>
            {l.who}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-700">{l.text}</p>
        </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── Reveal-wrapped mockup helper ─────────────────────── */
export function MockupReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <Reveal delay={delay} variant="scale" className={className}>
      {children}
    </Reveal>
  );
}

/* ── Power dialer queue ───────────────────────────────── */
export function PowerQueue() {
  const rows = [
    { name: 'VP Sales', meta: 'Called 2m ago · Connected 3:18', done: true },
    { name: 'Sales Manager', meta: 'Calling now…', active: true },
    { name: 'SDR', meta: 'Up next · (415) 555-0119' },
    { name: 'Account Executive', meta: 'Up next · (212) 555-0142' },
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-zinc-900">Power session · Q3 follow-ups</p>
        <span className="pm-chip !text-[11px]">47 / 200 dialed</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-3.5',
              r.active
                ? 'border-[#6d28d9]/25 bg-[#6d28d9]/[0.05] shadow-[0_8px_24px_-12px_rgba(109,40,217,0.4)]'
                : 'border-zinc-950/[0.06] bg-zinc-50/60',
              r.done && 'opacity-60'
            )}
          >
            <span className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold',
              r.active ? 'bg-[#6d28d9] text-white' : 'bg-zinc-950/[0.05] text-zinc-500'
            )}>
              {r.name.split(' ').map((w) => w[0]).join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-zinc-900">{r.name}</p>
              <p className="truncate text-[12px] text-zinc-500">{r.meta}</p>
            </div>
            {r.active ? (
              <span className="flex items-center gap-1.5 rounded-full bg-[#6d28d9] px-3 py-1.5 text-[11.5px] font-semibold text-white">
                <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-white" /> Calling
              </span>
            ) : r.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <span className="text-[11.5px] font-medium text-zinc-400">Queued</span>
            )}
          </div>
        ))}
      </div>
      <p className="pm-small mt-4 text-center">Disposition once — the next call starts instantly. No dialing, no dead air.</p>
    </div>
  );
}

/* ── Click to call ────────────────────────────────────── */
export function ClickToCall() {
  return (
    <div className="p-5 sm:p-6">
      <p className="text-[13px] font-semibold text-zinc-900">Leads · Prospect pipeline</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-950/[0.07]">
        {[
          { name: 'VP Sales', co: 'Enterprise · Outbound', hot: true },
          { name: 'Sales Manager', co: 'Mid-market · Outbound', hot: false },
          { name: 'SDR', co: 'SMB · Outbound', hot: true },
        ].map((l, i) => (
          <div
            key={l.name}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5',
              i !== 2 && 'border-b border-zinc-950/[0.05]',
              i === 0 ? 'bg-[#6d28d9]/[0.045]' : 'bg-white'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold text-zinc-900">
                {l.name}
                {l.hot && <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">HOT</span>}
              </p>
              <p className="truncate text-[12px] text-zinc-500">{l.co}</p>
            </div>
            <span className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-transform',
              i === 0 ? 'bg-[#6d28d9] text-white shadow-[0_8px_20px_-6px_rgba(109,40,217,0.6)]' : 'bg-zinc-950/[0.05] text-zinc-500'
            )}>
              <Phone className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>
      <p className="pm-small mt-4 text-center">One click on any number — in your list, your CRM, anywhere — and you’re talking.</p>
    </div>
  );
}

/* ── Audit trail ────────────────────────────────────── */
export function ComplianceCard() {
  const items = [
    { t: 'DNC respected everywhere', d: 'Flagged leads leave every queue instantly.' },
    { t: 'Recordings + transcripts stored', d: 'Every recorded call, searchable by lead.' },
    { t: 'Disposition history', d: 'Full outcome log on each lead’s timeline.' },
  ];
  return (
    <div className="p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Audit trail, automatic
      </p>
      <div className="mt-4 space-y-2.5">
        {items.map((x) => (
          <div key={x.t} className="flex items-start gap-3 rounded-xl border border-zinc-950/[0.06] bg-zinc-50/70 p-3.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-zinc-900">{x.t}</p>
              <p className="text-[12px] text-zinc-500">{x.d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SIGNATURE VISUAL: five lines fan into one conversation ──
   An ownable concept diagram (not a screenshot): one rep, five parallel
   lines, one live conversation. Desktop shows the fan; mobile gets a
   purpose-built stacked list so nothing collides at 390px. */
const FAN_LEGS = [
  { line: 'Line 1', who: 'VP Sales', status: 'Ringing', tone: 'zinc' as const },
  { line: 'Line 2', who: 'Sales Manager', status: 'Voicemail · dropped', tone: 'amber' as const },
  { line: 'Line 3', who: 'SDR', status: 'Connected · 03:18', tone: 'live' as const },
  { line: 'Line 4', who: 'Account Executive', status: 'Ringing', tone: 'zinc' as const },
  { line: 'Line 5', who: 'Founder', status: 'Ringing', tone: 'zinc' as const },
];

/* Fan curve per row: each line starts near the vertical middle of the rep
   rail (the fan's origin) and lands centered on its prospect card. */
function fanPath(i: number) {
  const startY = [58, 47, 38, 29, 18][i] ?? 38;
  return `M 0 ${startY} C 110 ${startY}, 170 38, 300 38`;
}

function FanLegCard({ leg }: { leg: (typeof FAN_LEGS)[number] }) {
  return (
    <div
      className={cn(
        'w-40 shrink-0 rounded-xl border p-3 sm:w-44',
        leg.tone === 'live' && 'border-[#6d28d9]/35 bg-[#6d28d9]/[0.06] shadow-[0_8px_24px_-12px_rgba(109,40,217,0.45)]',
        leg.tone === 'amber' && 'border-amber-500/25 bg-amber-50/60',
        leg.tone === 'zinc' && 'border-zinc-950/[0.07] bg-zinc-50/60'
      )}
    >
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-400">
        {leg.tone === 'live' && <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />}
        {leg.line}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-zinc-900">{leg.who}</p>
      <p
        className={cn(
          'mt-0.5 truncate text-[11.5px] font-medium',
          leg.tone === 'live' && 'text-[#6d28d9]',
          leg.tone === 'amber' && 'text-amber-700',
          leg.tone === 'zinc' && 'text-zinc-500'
        )}
      >
        {leg.status}
      </p>
    </div>
  );
}

export function ParallelFan({ className }: { className?: string }) {
  return (
    <figure className={cn('not-prose', className)}>
      <div className="overflow-hidden rounded-[1.6rem] border border-zinc-950/[0.08] bg-white shadow-[0_2px_4px_rgba(9,9,11,0.04),0_32px_64px_-24px_rgba(109,40,217,0.18)]">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.06] px-5 py-4 sm:px-6">
          <p className="text-[13px] font-semibold text-zinc-900">Parallel session</p>
          <span className="pm-chip !gap-1.5 !text-[11px]">
            <span className="font-bold text-[#6d28d9]">5 lines</span>
            <span aria-hidden>→</span>
            <span className="font-semibold text-zinc-600">1 conversation</span>
          </span>
        </div>

        {/* desktop: the fan */}
        <div aria-hidden={false} className="hidden px-5 py-6 sm:block sm:px-6">
          <div className="grid grid-cols-[60px_1fr] gap-x-2">
            <div className="row-span-5 flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] py-5 text-white shadow-[0_12px_28px_-10px_rgba(109,40,217,0.6)]">
              <Phone className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-[0.28em] [writing-mode:vertical-rl]">YOU</span>
            </div>
            {FAN_LEGS.map((leg, i) => (
              <Reveal key={leg.line} delay={i * 90} className="pm-leg-in">
              <div className="flex items-center gap-3 py-[6px]">
                <svg viewBox="0 0 300 76" preserveAspectRatio="none" className="h-[62px] min-w-0 flex-1" aria-hidden="true">
                  <path
                    d={fanPath(i)}
                    fill="none"
                    stroke={leg.tone === 'live' ? '#6d28d9' : leg.tone === 'amber' ? '#f59e0b' : '#d4d4d8'}
                    strokeWidth={leg.tone === 'live' ? 5 : 2.5}
                    strokeLinecap="round"
                    opacity={leg.tone === 'live' ? 1 : 0.9}
                    className={cn(leg.tone === 'live' && 'pm-live-glow')}
                  />
                  {/* flowing signal overlay — data traveling down the line */}
                  <path
                    d={fanPath(i)}
                    fill="none"
                    stroke={leg.tone === 'live' ? '#a78bfa' : leg.tone === 'amber' ? '#fbbf24' : '#a1a1aa'}
                    strokeWidth={leg.tone === 'live' ? 2.5 : 1.5}
                    strokeLinecap="round"
                    className={cn(leg.tone === 'live' ? 'pm-flow' : 'pm-flow-slow')}
                    style={leg.tone !== 'live' ? { animationDelay: `${i * 0.5}s` } : undefined}
                  />
                </svg>
                <FanLegCard leg={leg} />
              </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* mobile: stacked list + the one conversation */}
        <div className="px-5 py-5 sm:hidden">
          <div className="overflow-hidden rounded-2xl border border-zinc-950/[0.07]">
            {FAN_LEGS.map((leg, i) => (
              <div
                key={leg.line}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i > 0 && 'border-t border-zinc-950/[0.05]',
                  leg.tone === 'live' && 'bg-[#6d28d9]/[0.05]'
                )}
              >
                <span className="w-14 shrink-0 text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  {leg.line}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">{leg.who}</p>
                  <p
                    className={cn(
                      'truncate text-[11.5px] font-medium',
                      leg.tone === 'live' && 'text-[#6d28d9]',
                      leg.tone === 'amber' && 'text-amber-700',
                      leg.tone === 'zinc' && 'text-zinc-500'
                    )}
                  >
                    {leg.status}
                  </p>
                </div>
                {leg.tone === 'live' && <span className="pm-pulse-dot h-2 w-2 shrink-0 rounded-full bg-[#6d28d9]" />}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-[#6d28d9] p-4 text-white shadow-[0_16px_32px_-12px_rgba(109,40,217,0.55)]">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/70">One conversation</p>
            <p className="mt-1 text-[14px] font-semibold">SDR · connected 03:18 — you’re talking</p>
            <Waveform bars={26} color="#ffffff" className="mt-2 h-7 opacity-70" />
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-zinc-950/[0.06] bg-zinc-50/70 px-5 py-4 sm:px-6">
          <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-zinc-600">
            <Voicemail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            Answering-machine detection dropped your voicemail on line 2 — you only ever talk to humans.
          </p>
        </div>
      </div>
      <figcaption className="pm-caption">Concept visual — five lines, one conversation.</figcaption>
    </figure>
  );
}
