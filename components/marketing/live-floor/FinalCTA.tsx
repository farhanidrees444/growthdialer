'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LiveWaveform, MiniWave } from './LiveWaveform';
import { EASE_OUT } from './motion';

const APP_URL = 'https://app.growthdialer.com';
const APP_SIGNIN = 'https://app.growthdialer.com/signin';
const APP_SIGNUP = 'https://app.growthdialer.com/signup';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Docs', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Customers', href: '/customers' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact-sales' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function FinalCTA() {
  return (
    <>
      {/* CTA */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[min(92vw,820px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-8 flex justify-center">
            <LiveWaveform bars={28} height={36} barWidth={2.5} gap={3} />
          </div>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
            Stop taking notes.
            <br />
            <span className="font-medium">Start hearing everything.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-zinc-400">
            Spin up your first AI-analyzed call in minutes. No credit card, no
            setup call — just dial.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_SIGNUP}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={APP_SIGNIN}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] px-7 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Log in
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <MiniWave className="scale-90" />
              </span>
              <span className="text-[15px] font-medium tracking-tight text-[#F5F5F7]">GrowthDialer</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-zinc-500">
              The AI sales dialer that turns every conversation into searchable
              revenue intelligence.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-zinc-400 transition-colors hover:text-[#F5F5F7]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row">
          <p className="text-[12px] text-zinc-600">
            © {new Date().getFullYear()} GrowthDialer. All rights reserved.
          </p>
          <a
            href={APP_URL}
            className="text-[12px] text-zinc-500 transition-colors hover:text-[#F5F5F7]"
          >
            app.growthdialer.com
          </a>
        </div>
      </footer>
    </>
  );
}
