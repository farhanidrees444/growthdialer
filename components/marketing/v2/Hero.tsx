'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Play } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';
import { HERO, RISK_BULLETS } from './copy';
import { Aurora, Magnetic, Noise, usePrefersReducedMotion } from './motion';
import { HeroConsole3D } from './Hero3d';

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  /* camera-pull: as the hero scrolls away the console recedes (scale + drift + tilt) */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const stageRotX = useTransform(scrollYProgress, [0, 1], [0, 6]);

  const textStyle = reduced ? undefined : { y: textY, opacity: textOpacity };
  const stageStyle = reduced ? undefined : { scale: stageScale, y: stageY, rotateX: stageRotX };

  return (
    <section ref={ref} className="relative overflow-hidden pt-36 sm:pt-44">
      {/* backdrop: animated aurora mesh + grain + dot grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Aurora />
        <Noise />
        <div className="pm-dot-grid pm-fade-hero absolute inset-0" />
      </div>

      <div className="pm-container relative">
        <motion.div style={textStyle} className="mx-auto max-w-4xl text-center">
          <Reveal>
            <Link href={HERO.eyebrowHref} className="pm-chip transition-colors hover:border-zinc-950/25">
              <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {HERO.eyebrow}
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            </Link>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="pm-h-display mt-7">{HERO.title}</h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="pm-lead mx-auto mt-6 max-w-2xl">{HERO.lede}</p>
          </Reveal>

          <Reveal delay={230}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic strength={14} className="w-full sm:w-auto">
                <a href={HERO.primaryCta.href} className="pm-btn pm-btn-primary w-full sm:w-auto">
                  {HERO.primaryCta.label}
                  <ArrowRight className="h-[18px] w-[18px]" />
                </a>
              </Magnetic>
              <Magnetic strength={14} className="w-full sm:w-auto">
                <Link href={HERO.secondaryCta.href} className="pm-btn pm-btn-secondary w-full sm:w-auto">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-white">
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  </span>
                  {HERO.secondaryCta.label}
                </Link>
              </Magnetic>
            </div>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {RISK_BULLETS.map((r) => (
                <li key={r} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-zinc-500">
                  <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </motion.div>

        {/* 3D product visual */}
        <motion.div style={stageStyle} className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
          <Reveal delay={200} variant="scale">
            <HeroConsole3D />
          </Reveal>
        </motion.div>

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
