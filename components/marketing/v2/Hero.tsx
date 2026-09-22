'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';
import { HERO, RISK_BULLETS } from './copy';
import { Magnetic, Noise, usePrefersReducedMotion } from './motion';
import { ParallelFan } from './Mockups';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── headline mask-line reveal: each line rises out of its mask ── */
function MaskLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <span className="pm-mask"><span>{children}</span></span>;
  return (
    <span className="pm-mask" aria-hidden={false}>
      <motion.span
        initial={{ y: '112%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Editorial, asymmetric hero: the point of view is the headline —
 * "Your reps were hired to talk. Not to type." — set large on the left,
 * with the signature parallel-dialing concept visual owning the right.
 * Violet is the one confident brand color: headline accent, primary CTA,
 * and the visual's live line.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -64]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 130]);

  const copyStyle = reduced ? undefined : { y: copyY, opacity: copyOpacity };
  const visualStyle = reduced ? undefined : { y: visualY };

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 sm:pt-40">
      {/* backdrop: violet brand glow + grain + dot grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="pm-glow-violet absolute inset-x-0 top-0 h-[560px] opacity-90" />
        <Noise />
        <div className="pm-dot-grid pm-fade-hero absolute inset-0" />
      </div>

      <div className="pm-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* point of view */}
          <motion.div style={copyStyle} className="lg:col-span-5">
            <Reveal>
              <Link href={HERO.eyebrowHref} className="pm-chip transition-colors hover:border-zinc-950/25">
                <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />
                {HERO.eyebrow}
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            </Reveal>

            <h1 className="pm-h-display mt-7 !text-[clamp(2.6rem,5.2vw,4.3rem)]">
              <MaskLine delay={0.1}>
                Your reps were hired to <span className="text-[#6d28d9]">talk.</span>
              </MaskLine>
              <MaskLine delay={0.22}>Not to type.</MaskLine>
            </h1>

            <Reveal delay={150}>
              <p className="pm-lead mt-6 max-w-md">{HERO.lede}</p>
            </Reveal>

            <Reveal delay={230}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Magnetic strength={14} className="w-full sm:w-auto">
                  <a href={HERO.primaryCta.href} className="pm-btn pm-btn-brand pm-shimmer w-full sm:w-auto">
                    {HERO.primaryCta.label}
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </a>
                </Magnetic>
                <Magnetic strength={14} className="w-full sm:w-auto">
                  <Link href={HERO.secondaryCta.href} className="pm-btn pm-btn-secondary w-full sm:w-auto">
                    {HERO.secondaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
              </div>
              <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                {RISK_BULLETS.map((r) => (
                  <li key={r} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-zinc-500">
                    <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
          </motion.div>

          {/* signature visual */}
          <motion.div style={visualStyle} className="lg:col-span-7">
            <Reveal delay={200} variant="scale">
              <div className="relative">
                <div aria-hidden className="pm-glow-violet absolute -inset-8 -z-10 opacity-70" />
                <ParallelFan />
              </div>
            </Reveal>
          </motion.div>
        </div>

        {!reduced && (
          <div aria-hidden className="mx-scroll-hint pb-2">
            <span>Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* fade into next section */}
      <div aria-hidden className="pointer-events-none relative h-20 bg-gradient-to-b from-transparent to-white sm:h-28" />
    </section>
  );
}
