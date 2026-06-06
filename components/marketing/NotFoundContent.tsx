'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Home, BookOpen, Phone } from 'lucide-react';
import { ShimmerButton } from '@/components/marketing/live-floor/ShimmerButton';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/features', label: 'Features', icon: Phone },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/pricing', label: 'Pricing', icon: ArrowRight },
];

export function NotFoundContent() {
  const reduce = useReducedMotion();

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-5 py-24 text-center lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.10] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mb-8 flex justify-center"
      >
        <LiveWaveform bars={24} height={32} barWidth={2.5} gap={3} />
      </motion.div>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: EASE_OUT }}
        className="relative font-mono text-[13px] uppercase tracking-[0.25em] text-zinc-600"
      >
        Error 404
      </motion.p>

      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
        className="relative mt-4 font-display text-[clamp(3rem,10vw,7rem)] font-light leading-none tracking-tight text-[#F5F5F7]"
      >
        Wrong number.
      </motion.h1>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
        className="relative mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-zinc-400"
      >
        This page doesn&apos;t exist — or it moved. Head back to the dialer or pick a destination below.
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.26, ease: EASE_OUT }}
        className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <ShimmerButton href="https://app.growthdialer.com/signup">
          Start Free
          <ArrowRight className="h-4 w-4" />
        </ShimmerButton>
        <ShimmerButton href="/" variant="ghost">
          Back to home
        </ShimmerButton>
      </motion.div>

      <motion.nav
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.34, ease: EASE_OUT }}
        aria-label="Helpful links"
        className="relative mt-12 grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-[13px] text-zinc-400 transition-all hover:border-[#7C3AED]/30 hover:bg-[#7C3AED]/[0.06] hover:text-[#F5F5F7]"
            >
              <Icon className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-[#A78BFA]" />
              {link.label}
            </Link>
          );
        })}
      </motion.nav>
    </section>
  );
}
