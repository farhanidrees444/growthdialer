'use client';

import { CountUp } from './CountUp';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_STATS } from '@/lib/marketing/honest-copy';

const STATS = MARKETING_STATS;

export function StatsStrip() {
  return (
    <section className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={i} delay={i * 70}>
            <div className="mk-card mk-card-hover h-full px-6 py-10 text-center">
              <p className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold tracking-tight text-zinc-950">
                <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-[14px] text-zinc-600">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
