'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, BarChart3, Headphones, Zap, TrendingUp, Check } from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { Reveal } from '@/components/ui/reveal';
import { CountUp } from './CountUp';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'ai', label: 'AI Dialer', icon: Phone },
  { id: 'power', label: 'Power Dialer', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'coaching', label: 'Coaching', icon: Headphones },
] as const;

type TabId = (typeof TABS)[number]['id'];

function useTimer(active: boolean, reduce: boolean | null) {
  const [s, setS] = useState(47);
  useEffect(() => {
    if (!active || reduce) return;
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [active, reduce]);
  return s;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function AiDialerView({ active }: { active: boolean }) {
  const reduce = useMarketingMotionReduced();
  const seconds = useTimer(active, reduce);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-zinc-950/[0.08] bg-zinc-50 p-4">
        <div>
          <p className="text-sm font-medium text-zinc-950">Jordan Chen · Acme Co.</p>
          <p className="font-mono text-xs tabular-nums text-zinc-500">{fmt(seconds)}</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          Live
        </span>
      </div>
      <LiveWaveform bars={48} height={56} />
      <div className="space-y-2">
        {['Positive sentiment', 'Intent: pricing · 12 seats', 'Coach tip: mention annual discount'].map(
          (t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: 12 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.4, ease: EASE_OUT }}
              className="flex items-center gap-2 rounded-lg border border-[#7C3AED]/15 bg-[#7C3AED]/[0.06] px-3 py-2 text-[13px] text-zinc-700"
            >
              <Check className="h-3.5 w-3.5 text-[#6D28D9]" />
              {t}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}

function PowerDialerView({ active }: { active: boolean }) {
  const queue = [
    { name: 'Jordan · Acme', status: 'On call', tone: 'text-emerald-700' },
    { name: 'Sam · Nova', status: 'Queued', tone: 'text-zinc-500' },
    { name: 'Alex · Bolt', status: 'Callback', tone: 'text-amber-700' },
    { name: 'Riley · Peak', status: 'Queued', tone: 'text-zinc-500' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-zinc-600">12 of 47 complete today</span>
        <span className="text-[12px] text-zinc-400">sample data</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-950/[0.06]">
        <motion.div
          className="h-full rounded-full bg-[#7C3AED]"
          initial={{ width: '0%' }}
          animate={active ? { width: '26%' } : {}}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        />
      </div>
      <ul className="space-y-2">
        {queue.map((q, i) => (
          <li
            key={q.name}
            className={cn(
              'flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px]',
              i === 0
                ? 'border-[#7C3AED]/30 bg-[#7C3AED]/[0.06]'
                : 'border-zinc-950/[0.06] bg-white'
            )}
          >
            <span className="text-zinc-800">{q.name}</span>
            <span className={cn('text-[11px] font-medium', q.tone)}>{q.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalyticsView({ active }: { active: boolean }) {
  const points = [42, 48, 45, 52, 58, 55, 62, 68, 64, 71];
  const max = Math.max(...points);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: 47, l: 'Calls', suffix: '' },
          { v: 68, l: 'Answer %', suffix: '%' },
          { v: 72, l: 'Talk min', suffix: '' },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-zinc-950/[0.08] bg-zinc-50 p-3 text-center">
            <p className="font-display text-xl font-semibold text-zinc-950">
              {active ? <CountUp to={s.v} suffix={s.suffix} /> : `${s.v}${s.suffix}`}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-950/[0.08] bg-zinc-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          <TrendingUp className="h-3 w-3" /> Connect rate · 30d
        </p>
        <div className="flex h-24 items-end gap-1">
          {points.map((p, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-[#7C3AED]/20 to-[#7C3AED]"
              initial={{ height: 0 }}
              animate={active ? { height: `${(p / max) * 100}%` } : {}}
              transition={{ delay: i * 0.04, duration: 0.5, ease: EASE_OUT }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachingView({ active }: { active: boolean }) {
  const reps = [
    { name: 'Jordan', state: 'Live · listening', color: 'bg-emerald-500' },
    { name: 'Sam', state: 'On hold', color: 'bg-amber-400' },
    { name: 'Alex', state: 'Ready', color: 'bg-zinc-300' },
  ];
  return (
    <div className="space-y-3">
      {reps.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex items-center gap-3 rounded-xl border border-zinc-950/[0.08] bg-white p-3"
        >
          <span className={cn('h-2 w-2 rounded-full', r.color, i === 0 && active && 'animate-pulse')} />
          <div>
            <p className="text-sm font-medium text-zinc-950">{r.name}</p>
            <p className="text-[12px] text-zinc-500">{r.state}</p>
          </div>
          {i === 0 && (
            <Headphones className="ml-auto h-4 w-4 text-[#6D28D9]" aria-hidden />
          )}
        </motion.div>
      ))}
    </div>
  );
}

const VIEWS: Record<TabId, React.FC<{ active: boolean }>> = {
  ai: AiDialerView,
  power: PowerDialerView,
  analytics: AnalyticsView,
  coaching: CoachingView,
};

export function ProductPreviewTabs() {
  const [tab, setTab] = useState<TabId>('ai');
  const View = VIEWS[tab];

  return (
    <section className="relative px-5 py-20 lg:px-8 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="mk-eyebrow justify-center">Product preview</p>
        <h2 className="mk-h-section">
          One platform. <span className="font-semibold">Four modes.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-zinc-600">
          Switch between dial, queue, analytics and coaching — an illustrative preview with sample
          data, not a screenshot of your calls.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Product views">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200',
                  active
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_24px_rgba(9,9,11,0.18)]'
                    : 'border-zinc-950/[0.08] bg-white text-zinc-600 hover:border-zinc-950/[0.16] hover:text-zinc-950'
                )}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {active && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  )}
                  <span
                    className={cn(
                      'relative inline-flex h-2 w-2 rounded-full',
                      active ? 'bg-emerald-400' : 'bg-zinc-300'
                    )}
                  />
                </span>
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mk-card relative overflow-hidden p-6 lg:p-8">
          <div aria-hidden className="mk-glow-brand pointer-events-none absolute inset-0" />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="relative z-10"
            >
              <View active />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
