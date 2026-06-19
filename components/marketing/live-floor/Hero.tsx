'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Play, Phone, Sparkles, Activity, Mic2, CheckCircle2 } from 'lucide-react';
import { ShimmerButton } from './ShimmerButton';
import { TypewriterRotator } from './TypewriterRotator';
import { useMarketingMotionReduced, EASE_OUT } from './motion';
import { LottiePulse } from '@/components/marketing/home/LottiePulse';
import { cn } from '@/lib/utils';

const HEADLINE = ['Every', 'sales', 'call', 'turns', 'into', 'pipeline', 'intelligence.'];

function HeroHeadline() {
  return (
    <h1 className="font-display text-[clamp(2.6rem,7.5vw,6.7rem)] font-light leading-[0.96] tracking-[-0.06em] text-[var(--marketing-copy)]">
      {HEADLINE.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 26, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.72, delay: 0.12 + i * 0.055, ease: EASE_OUT }}
          className={cn(
            'mr-[0.18em] inline-block',
            i >= 5 && 'font-semibold marketing-shimmer-text',
          )}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

function VoiceOrb() {
  return (
    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
      <LottiePulse size={128} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06] shadow-[0_0_60px_rgba(124,58,237,0.35)] backdrop-blur-xl">
        <Mic2 className="h-7 w-7 text-[#C4B5FD]" />
      </div>
    </div>
  );
}

function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMarketingMotionReduced();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smoothX = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.4 });
  const smoothY = useSpring(my, { stiffness: 120, damping: 18, mass: 0.4 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 44, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.42, ease: EASE_OUT }}
      className="relative mx-auto mt-14 max-w-6xl [perspective:1600px]"
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="marketing-glass relative overflow-hidden rounded-[2rem] p-3 sm:p-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.22),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(6,182,212,0.16),transparent_34%)]" />
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[#09090b]/90">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/60" />
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              Live call analyzed
            </span>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr] md:p-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#7C3AED]/25 bg-[#7C3AED]/[0.08] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/20 text-[#C4B5FD]">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">Maya Patel · RevOps</p>
                    <p className="text-xs text-zinc-500">Connected · recording and AI active</p>
                  </div>
                  <p className="font-mono text-2xl font-semibold text-[#A78BFA]">03:18</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Calls', value: '84', icon: Activity },
                  { label: 'Connects', value: '31', icon: CheckCircle2 },
                  { label: 'AI notes', value: '19', icon: Sparkles },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                    <Icon className="mb-3 h-4 w-4 text-[#A78BFA]" />
                    <p className="font-display text-2xl font-semibold text-white">{value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label as string}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-600">Weekly connect rate</p>
                <div className="flex h-24 items-end gap-2">
                  {[32, 54, 44, 68, 71, 58, 82].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.65, delay: 0.75 + i * 0.045, ease: EASE_OUT }}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-[#7C3AED]/30 to-[#67E8F9]"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">AI summary</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                  <li>• Prospect asked for team pricing and onboarding timeline.</li>
                  <li>• Buying signal: replacing spreadsheet call tracking.</li>
                  <li>• Next step: send 12-seat annual proposal.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Transcript stream</p>
                <div className="mt-3 space-y-2">
                  {['Rep: What would make switching worth it?', 'Buyer: Faster call notes and coaching.', 'AI: Positive intent · pricing'].map((line, i) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.16, duration: 0.45 }}
                      className="rounded-xl bg-white/[0.035] px-3 py-2 text-xs text-zinc-400"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useMarketingMotionReduced();

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[480px] w-[min(92vw,860px)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 72%)',
        }}
      />

      <div className="relative z-[2] mx-auto max-w-4xl text-center">
        <VoiceOrb />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3.5 py-2 text-[12px] font-medium text-zinc-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            New: inbound voice and AI recordings are live
          </div>

          <HeroHeadline />

          <TypewriterRotator />

          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-zinc-400 sm:text-lg">
            GrowthDialer brings inbound, power dialing, recordings and AI call intelligence into one
            matte-black command center built for modern sales teams.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ShimmerButton href="https://app.growthdialer.com/signup">
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ShimmerButton>
            <ShimmerButton href="/demo" variant="ghost">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch 2-min demo
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
      <DashboardMockup />
    </section>
  );
}
