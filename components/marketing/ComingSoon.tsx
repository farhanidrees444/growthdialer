'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <section className="relative flex min-h-[78vh] items-center justify-center px-5 py-28 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.10] blur-[130px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <Reveal variant="scale" className="relative mx-auto max-w-xl text-center">
        <div className="pm-float mb-7 flex justify-center">
          <LiveWaveform bars={22} height={30} barWidth={2.5} gap={3} />
        </div>
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-2 pr-3 text-[12px] text-zinc-400 backdrop-blur-xl">
          <Clock className="h-3.5 w-3.5 text-[#06B6D4]" /> Coming soon
        </span>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-light leading-[1.04] tracking-tight text-[#F5F5F7]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-zinc-400">{blurb}</p>
        <Link
          href="/"
          className="mt-9 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-5 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Reveal>
    </section>
  );
}
