'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Check, Phone, Zap } from 'lucide-react';
import { StaticWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    id: 'live',
    label: 'Live call',
    icon: Phone,
  },
  {
    id: 'power',
    label: 'Power dial',
    icon: Zap,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
] as const;

type SlideId = (typeof SLIDES)[number]['id'];

function LiveSlide() {
  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/80 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">Jordan Chen · Acme Co.</p>
          <p className="font-mono text-xs tabular-nums text-zinc-500">Connected 02:17</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Recording
        </span>
      </div>
      <StaticWaveform bars={36} height={48} barWidth={2.5} gap={2.5} />
      <div className="space-y-2">
        {['Positive sentiment detected', 'Intent: pricing for 12 seats', 'Follow-up: send proposal Thursday'].map(
          (line) => (
            <div
              key={line}
              className="flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-3 py-2 text-[13px] text-zinc-400"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              {line}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function PowerSlide() {
  const rows = [
    { name: 'Sam · Nova Labs', status: 'On call', tone: 'text-emerald-400' },
    { name: 'Alex · Bolt Inc', status: 'Dialing', tone: 'text-violet-400' },
    { name: 'Riley · Peak Co', status: 'Queued', tone: 'text-zinc-500' },
    { name: 'Morgan · Apex', status: 'Queued', tone: 'text-zinc-500' },
  ];
  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        <span>Parallel session</span>
        <span className="text-violet-400">4 lines active</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-950/80 px-3 py-2.5"
        >
          <span className="text-sm text-zinc-300">{row.name}</span>
          <span className={cn('text-xs font-medium', row.tone)}>{row.status}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsSlide() {
  const stats = [
    { label: 'Calls today', value: '47', delta: '+12%' },
    { label: 'Connect rate', value: '18.4%', delta: '+2.1%' },
    { label: 'Meetings booked', value: '6', delta: '+3' },
  ];
  return (
    <div className="grid gap-3 p-1 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-zinc-800/50 bg-zinc-950/80 p-4 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{s.label}</p>
          <p className="mt-2 font-display text-2xl font-light tabular-nums text-zinc-100">{s.value}</p>
          <p className="mt-1 text-xs text-emerald-400">{s.delta}</p>
        </div>
      ))}
    </div>
  );
}

function SlideContent({ id }: { id: SlideId }) {
  if (id === 'live') return <LiveSlide />;
  if (id === 'power') return <PowerSlide />;
  return <AnalyticsSlide />;
}

export function ProductShowcase() {
  const reduce = useMarketingMotionReduced();
  const [active, setActive] = useState<SlideId>('live');

  useEffect(() => {
    if (reduce) return;
    const order: SlideId[] = ['live', 'power', 'analytics'];
    const id = setInterval(() => {
      setActive((prev) => order[(order.indexOf(prev) + 1) % order.length]);
    }, 4500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative w-full max-w-lg lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 shadow-[0_32px_64px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-b border-zinc-800/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] text-zinc-600">GrowthDialer — Product preview</span>
        </div>

        <div className="flex gap-1 border-b border-zinc-800/60 p-2">
          {SLIDES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-colors',
                active === id ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400',
              )}
            >
              {active === id && (
                <motion.span
                  layoutId="showcase-tab"
                  className="absolute inset-0 rounded-lg border border-zinc-700/60 bg-zinc-800/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="min-h-[280px] p-4 sm:p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              <SlideContent id={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
