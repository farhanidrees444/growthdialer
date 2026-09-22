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
    { name: 'Maya Patel', role: 'RevOps · Acme', state: 'active' },
    { name: 'Daniel Kim', role: 'VP Sales · Northwind', state: 'queued' },
    { name: 'Sofia Reyes', role: 'Founder · Loopwork', state: 'queued' },
    { name: 'James Okafor', role: 'SDR Lead · Vantage', state: 'done' },
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
            <p className="truncate text-[16px] font-semibold text-zinc-950">Maya Patel · RevOps</p>
            <p className="text-[12.5px] text-zinc-500">Connected · Recording on · Line 1 of 3</p>
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

/* ── Parallel dialing: three live legs ────────────────── */
export function ParallelDial() {
  const legs = [
    { name: 'Daniel Kim', status: 'Ringing', tone: 'zinc', icon: Phone },
    { name: 'Sofia Reyes', status: 'Voicemail · dropped', tone: 'amber', icon: Voicemail },
    { name: 'James Okafor', status: 'Connected · you’re talking', tone: 'emerald', icon: Mic },
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-zinc-900">Parallel session · 3 lines</p>
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
        <p className="text-[12.5px]">Synced to CRM · logged under <span className="font-semibold">Maya Patel</span> with recording attached.</p>
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
      {lines.map((l) => (
        <div
          key={l.text}
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
    { name: 'Maya Patel', meta: 'Called 2m ago · Connected 3:18', done: true },
    { name: 'Daniel Kim', meta: 'Calling now…', active: true },
    { name: 'Sofia Reyes', meta: 'Up next · (415) 555-0119' },
    { name: 'James Okafor', meta: 'Up next · (212) 555-0142' },
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
      <p className="text-[13px] font-semibold text-zinc-900">Leads · Acme pipeline</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-950/[0.07]">
        {[
          { name: 'Maya Patel', co: 'Acme Corp', hot: true },
          { name: 'Daniel Kim', co: 'Northwind', hot: false },
          { name: 'Sofia Reyes', co: 'Loopwork', hot: true },
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
