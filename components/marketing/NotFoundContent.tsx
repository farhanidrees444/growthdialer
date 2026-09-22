'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Home, PhoneCall, Tag, BookOpen } from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/features', label: 'Features', icon: PhoneCall },
  { href: '/pricing', label: 'Pricing', icon: Tag },
  { href: '/blog', label: 'Blog', icon: BookOpen },
];

export function NotFoundContent() {
  const reduce = useMarketingMotionReduced();

  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
        <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
      </div>

      <motion.div
        {...rise(0)}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mb-8 flex justify-center"
      >
        <div className="pm-float">
          <LiveWaveform bars={24} height={32} barWidth={2.5} gap={3} color="#7C3AED" />
        </div>
      </motion.div>

      <motion.p
        {...rise(0.05)}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative font-mono text-[13px] uppercase tracking-[0.25em] text-zinc-500"
      >
        Error 404
      </motion.p>

      <motion.h1
        {...rise(0.1)}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mt-4 text-[clamp(2.75rem,9vw,6rem)] font-semibold leading-none tracking-tight text-zinc-950"
      >
        Wrong number.
      </motion.h1>

      <motion.p
        {...rise(0.18)}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mx-auto mt-5 max-w-md text-[16.5px] leading-relaxed text-zinc-600"
      >
        That line doesn&apos;t ring anywhere. The page moved, or it never existed —
        either way, let&apos;s get you back to a call that connects.
      </motion.p>

      <motion.div
        {...rise(0.26)}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <a href="https://app.growthdialer.com/signup" className="pm-btn pm-btn-primary">
          Start free trial <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/" className="pm-btn pm-btn-secondary">
          Back to home
        </Link>
      </motion.div>

      <motion.nav
        {...rise(0.34)}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        aria-label="Helpful links"
        className="relative mt-12 grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-950/[0.08] bg-white px-3 py-4 text-[13px] font-medium text-zinc-600 shadow-[0_1px_2px_rgba(9,9,11,0.04)] transition-all hover:border-violet-600/30 hover:bg-violet-600/[0.04] hover:text-zinc-950"
            >
              <Icon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-violet-700" />
              {link.label}
            </Link>
          );
        })}
      </motion.nav>
    </section>
  );
}
