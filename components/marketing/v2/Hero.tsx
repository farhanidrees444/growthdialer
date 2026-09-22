'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronDown, Play } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';
import { HERO, RISK_BULLETS } from './copy';
import { Magnetic, Noise, Tilt3D, usePrefersReducedMotion } from './motion';

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  /* camera-pull: as the hero scrolls away the screenshot recedes (scale + drift + tilt) */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const stageRotX = useTransform(scrollYProgress, [0, 1], [0, 6]);

  const textStyle = reduced ? undefined : { y: textY, opacity: textOpacity };
  const stageStyle = reduced ? undefined : { scale: stageScale, y: stageY, rotateX: stageRotX };

  return (
    <section ref={ref} className="pm-dark">
      {/* backdrop: faint top glow + film grain — the product UI is the visual */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(109,40,217,0.22),transparent_70%)]" />
        <Noise opacity={0.05} className="mx-noise-light" />
      </div>

      <div className="pm-container relative pb-16 pt-36 sm:pb-20 sm:pt-44">
        <motion.div style={textStyle} className="max-w-3xl">
          <Reveal>
            <Link
              href={HERO.eyebrowHref}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-[12px] font-medium text-zinc-300 backdrop-blur transition-colors hover:border-white/30"
            >
              <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {HERO.eyebrow}
              <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
            </Link>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="pm-h-display mt-7 !text-white">{HERO.title}</h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="pm-lead mt-6 !text-zinc-400">{HERO.lede}</p>
          </Reveal>

          <Reveal delay={230}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Magnetic strength={14} className="w-full sm:w-auto">
                <a href={HERO.primaryCta.href} className="pm-btn pm-btn-white w-full sm:w-auto">
                  {HERO.primaryCta.label}
                  <ArrowRight className="h-[18px] w-[18px]" />
                </a>
              </Magnetic>
              <Magnetic strength={14} className="w-full sm:w-auto">
                <Link href={HERO.secondaryCta.href} className="pm-btn pm-btn-ghostlight w-full sm:w-auto">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950">
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  </span>
                  {HERO.secondaryCta.label}
                </Link>
              </Magnetic>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {RISK_BULLETS.map((r) => (
                <li key={r} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-zinc-400">
                  <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </motion.div>

        {/* real product visual: the actual AI Dialer, with 3D tilt */}
        <motion.div style={stageStyle} className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
          <Reveal delay={200} variant="scale">
            <Tilt3D maxX={7} maxY={10}>
              <figure className="not-prose">
                <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)]">
                  <Image
                    src="/images/product/dialer-main.webp"
                    alt="The actual GrowthDialer AI Dialer — manual, power, and parallel dialing modes"
                    width={1600}
                    height={828}
                    sizes="(max-width: 1024px) 100vw, 1152px"
                    priority
                  />
                </div>
                <figcaption className="pm-caption !text-zinc-500">
                  Actual GrowthDialer product UI — the AI Dialer.
                </figcaption>
              </figure>
            </Tilt3D>
          </Reveal>
        </motion.div>

        {!reduced && (
          <div aria-hidden className="mx-scroll-hint pb-2 !text-zinc-500">
            <span>Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* fade into next section */}
      <div aria-hidden className="pointer-events-none relative h-16 bg-gradient-to-b from-transparent to-white sm:h-20" />
    </section>
  );
}
