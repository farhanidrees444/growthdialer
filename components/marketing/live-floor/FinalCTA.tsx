'use client';

import { ArrowRight } from 'lucide-react';
import { SiteFooter } from './SiteFooter';
import { Reveal } from '@/components/ui/reveal';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export function FinalCTA() {
  return (
    <>
      <section className="relative overflow-hidden px-5 py-28 lg:px-8 lg:py-36">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="mk-dot-grid mk-fade-grid absolute inset-0" />
          <div className="mk-light-rays absolute inset-x-0 top-0 h-[520px] opacity-80" />
        </div>

        <Reveal className="relative mx-auto max-w-3xl">
          <div className="mk-card relative overflow-hidden px-6 py-14 text-center sm:px-10">
            <div aria-hidden className="mk-glow-brand pointer-events-none absolute inset-0" />
            <div className="relative">
              <p className="mk-eyebrow justify-center">Get started</p>
              <h2 className="mk-h-section">
                Bring every call
                <br />
                <span className="font-semibold">back into focus.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-zinc-600">
                Start with a real web dialer, then layer recordings, AI summaries, coaching and analytics as your team grows.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/pricing" className="mk-btn mk-btn-secondary">
                  See pricing
                </a>
              </div>
              <p className="mt-6 text-[13px] text-zinc-500">
                Free Starter · no credit card · calling in minutes
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}
