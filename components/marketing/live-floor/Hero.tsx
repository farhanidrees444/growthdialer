'use client';

import { useEffect, useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, Phone, Check, TrendingUp, Play, Shield, Calendar } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { ShimmerButton } from './ShimmerButton';
import { TypewriterRotator } from './TypewriterRotator';
import { HeroWebGL } from './HeroWebGL';
import { LottiePulse } from '@/components/marketing/home/LottiePulse';
import { useMarketingMotionReduced, EASE_OUT, SPRING } from './motion';

const HEADLINE = ['Every', 'call,', 'understood', 'the', 'moment', 'it', 'ends.'];

function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="fixed left-0 right-0 top-16 z-40 flex h-9 items-center justify-center gap-2 border-b border-[#7C3AED]/10 bg-[#7C3AED]/[0.08] px-4 text-[13px] backdrop-blur-md"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      <span className="text-zinc-300">
        <span className="font-medium text-[#F5F5F7]">Live</span>
        <span className="mx-2 text-zinc-600">·</span>
        New: AI Call Briefs are here
      </span>
      <a href="/features/ai" className="font-medium text-[#A78BFA] hover:text-[#C4B5FD]">
        Learn more →
      </a>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-4 text-zinc-500 hover:text-zinc-300"
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useMarketingMotionReduced();

  return (
    <>
      <AnnouncementBar />
      <section className="relative min-h-[92vh] overflow-hidden px-5 pb-16 pt-36 lg:px-8 lg:pb-20 lg:pt-44">
        <HeroWebGL />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[520px] w-[min(90vw,900px)] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />

        <div className="relative z-[2] mx-auto flex max-w-7xl flex-col items-center gap-14 text-center lg:gap-16">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="mb-6 flex justify-center"
            >
              <LottiePulse size={80} />
            </motion.div>

            <h1 className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] font-light leading-[0.98] tracking-tight text-[#F5F5F7]">
              {HEADLINE.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={
                    word === 'understood'
                      ? 'font-semibold text-[#A78BFA]'
                      : i < 2
                        ? 'inline-block'
                        : 'inline-block'
                  }
                >
                  {word}{' '}
                </motion.span>
              ))}
            </h1>

            <TypewriterRotator />

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.35 }}
              className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400"
            >
              GrowthDialer records, transcribes and analyzes every conversation — turning raw calls
              into summaries, sentiment and next steps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.45 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <ShimmerButton href="https://app.growthdialer.com/signup">
                Start Free — No Card
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ShimmerButton>
              <ShimmerButton href="/demo" variant="ghost">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Watch 2-min demo
              </ShimmerButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.55 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-zinc-600"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-zinc-500" />
                Built for growing sales teams
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                SOC 2 in progress
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                No annual lock-in
              </span>
            </motion.p>
          </div>

          <HeroMockup />
        </div>
      </section>
    </>
  );
}

function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMarketingMotionReduced();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING, delay: 0.4 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        reduce
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 1200,
            }
      }
      className="relative w-full max-w-2xl animate-float"
    >
      <BorderBeamCard>
        <div className="mb-5 flex items-center gap-1.5 border-b border-white/[0.05] pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] text-zinc-600">GrowthDialer — Live call</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#A78BFA]">
              <Phone className="h-4 w-4" />
            </span>
            <div className="text-left">
              <p className="text-sm font-medium text-[#F5F5F7]">Jordan at Acme Co.</p>
              <p className="font-mono text-xs tabular-nums text-zinc-500">Connected 2:17</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Recording
          </span>
        </div>
        <div className="my-6">
          <LiveWaveform bars={56} height={76} />
        </div>
        <div className="space-y-2 rounded-xl border border-white/[0.05] bg-black/30 p-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Transcribing</p>
          <p className="text-[13px] leading-relaxed text-zinc-400">
            &ldquo;…that actually solves the follow-up problem for us. Can you send pricing for a team
            of twelve?&rdquo;
            <motion.span
              className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-[#7C3AED]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </p>
        </div>
        <div className="mt-3 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" /> AI insights
          </p>
          <AiInsights />
        </div>
      </BorderBeamCard>
    </motion.div>
  );
}

const INSIGHTS = [
  { icon: TrendingUp, label: 'Positive sentiment', tone: 'text-emerald-400' },
  { icon: Check, label: 'Evaluating 12-seat team', tone: 'text-[#A78BFA]' },
  { icon: Check, label: 'Follow up Thursday', tone: 'text-[#A78BFA]' },
];

function AiInsights() {
  const reduce = useMarketingMotionReduced();
  const [shown, setShown] = useState(reduce ? INSIGHTS.length : 0);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const tick = () => setShown((i = i >= INSIGHTS.length ? 0 : i + 1));
    const id = setInterval(tick, 1100);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="space-y-1.5">
      {INSIGHTS.map((ins, idx) => {
        const Icon = ins.icon;
        const visible = idx < shown;
        return (
          <motion.div
            key={ins.label}
            initial={false}
            animate={{ opacity: visible ? 1 : 0.15, x: visible ? 0 : -6 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${ins.tone}`} />
            <span className="text-[13px] text-zinc-300">{ins.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function BorderBeamCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-[1px] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #7C3AED 340deg, #A78BFA 360deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 rounded-2xl border border-white/[0.06]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/90 p-6 backdrop-blur-xl">
        <Spotlight color="#7C3AED" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
