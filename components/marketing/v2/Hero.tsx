'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { HERO, RISK_BULLETS } from './copy';
import { BrowserFrame, DialerConsole, LiveBadge } from './Mockups';
import { Check } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44">
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="pm-dot-grid pm-fade-hero absolute inset-0" />
        <div className="pm-glow-violet absolute left-1/2 top-0 h-[560px] w-[min(94vw,980px)] -translate-x-1/2" />
      </div>

      <div className="pm-container relative">
        <div className="mx-auto max-w-4xl text-center">
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
              <a href={HERO.primaryCta.href} className="pm-btn pm-btn-primary w-full sm:w-auto">
                {HERO.primaryCta.label}
                <ArrowRight className="h-[18px] w-[18px]" />
              </a>
              <Link href={HERO.secondaryCta.href} className="pm-btn pm-btn-secondary w-full sm:w-auto">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-white">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                </span>
                {HERO.secondaryCta.label}
              </Link>
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
        </div>

        {/* product visual */}
        <Reveal delay={200} variant="scale" className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
          <div aria-hidden className="pm-glow-violet absolute -inset-x-8 -top-8 bottom-1/3" />
          <div className="pm-float-slow relative">
            <BrowserFrame badge={<LiveBadge />}>
              <DialerConsole />
            </BrowserFrame>
          </div>
        </Reveal>
      </div>

      {/* fade into next section */}
      <div aria-hidden className="pointer-events-none relative h-20 bg-gradient-to-b from-transparent to-white sm:h-28" />
    </section>
  );
}
