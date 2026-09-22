'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, PhoneCall, Plug2 } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from './copy';
import { FAQS, FINAL_CTA, HOW_IT_WORKS, PERSONAS, PRICING_TEASER, RISK_BULLETS, STACK_BAND, TRUST } from './copy';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Section head ─────────────────────────────────────── */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'center',
  dark = false,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'center' | 'left';
  dark?: boolean;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'mb-14 sm:mb-16',
        align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl',
        className
      )}
    >
      <p className={cn('pm-eyebrow', align === 'center' && 'pm-eyebrow-centered', dark && '!text-violet-300')}>
        {eyebrow}
      </p>
      <h2 className={dark ? 'pm-h-section-dark' : 'pm-h-section'}>{title}</h2>
      {lede && <p className={cn('mt-5', dark ? 'pm-lead-dark' : 'pm-lead')}>{lede}</p>}
    </Reveal>
  );
}

/* ── LGM-pattern feature group ────────────────────────── */
export type FeatureRow = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: ReactNode;
  flip?: boolean;
};

export function FeatureGroup({
  eyebrow,
  title,
  lede,
  rows,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  rows: FeatureRow[];
}) {
  return (
    <div className="pm-section">
      <div className="pm-container">
        <SectionHead eyebrow={eyebrow} title={title} lede={lede} align="left" />
        <div className="space-y-20 sm:space-y-28">
          {rows.map((row, i) => (
            <div
              key={row.title}
              className={cn(
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
              )}
            >
              <Reveal className={cn(row.flip && 'lg:order-2')}>
                <p className="pm-eyebrow !mb-3">{row.eyebrow}</p>
                <h3 className="pm-h-group">{row.title}</h3>
                <p className="pm-body mt-4 max-w-lg">{row.body}</p>
                <ul className="mt-6 space-y-3">
                  {row.bullets.map((b) => (
                    <li key={b} className="pm-tick">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120} variant="scale" className={cn(row.flip && 'lg:order-1')}>
                {row.visual}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Persona cards ────────────────────────────────────── */
export function PersonaCards() {
  return (
    <div className="pm-section pm-divider bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead eyebrow={PERSONAS.eyebrow} title={PERSONAS.title} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.cards.map((p, i) => (
            <Reveal key={p.role} delay={i * 80}>
              <article className="pm-card pm-card-hover flex h-full flex-col p-7">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#6d28d9]">{p.role}</p>
                <h3 className="pm-h-card mt-4">{p.headline}</h3>
                <p className="pm-body mt-3 flex-1 !text-[14.5px]">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Dark trust band ──────────────────────────────────── */
export function TrustBand() {
  return (
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[480px]" />
      <div className="pm-container pm-section relative">
        <SectionHead dark eyebrow={TRUST.eyebrow} title={TRUST.title} lede={TRUST.lede} />
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST.items.map((t, i) => (
            <Reveal key={t.title} delay={i * 90}>
              <article className="pm-card-dark h-full p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  {i === 0 ? <PhoneCall className="h-5 w-5" /> : i === 1 ? <Plug2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                </span>
                <h3 className="mt-5 font-display text-[1.25rem] font-semibold tracking-tight text-white">{t.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-400">{t.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */
export function HowItWorks() {
  return (
    <div id="how-it-works" className="pm-section">
      <div className="pm-container">
        <SectionHead eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} />
        <div className="grid gap-10 md:grid-cols-3 md:gap-6">
          {HOW_IT_WORKS.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="relative h-full border-t-2 border-zinc-950/[0.08] pt-8">
                <p className="pm-step-num" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="pm-h-card mt-5">{s.title}</h3>
                <p className="pm-body mt-3">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stack band (honest integrations) ─────────────────── */
export function StackBand() {
  return (
    <div className="pm-section-tight pm-divider">
      <div className="pm-container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="pm-eyebrow pm-eyebrow-centered">{STACK_BAND.eyebrow}</p>
          <h2 className="pm-h-group">{STACK_BAND.title}</h2>
          <p className="pm-body mt-4">{STACK_BAND.lede}</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {STACK_BAND.items.map((name) => (
              <span key={name} className="pm-chip !px-5 !py-2.5 !text-[14px]">
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ── Pricing teaser ───────────────────────────────────── */
export function PricingTeaser() {
  return (
    <div className="pm-section pm-divider bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead
          eyebrow={PRICING_TEASER.eyebrow}
          title={PRICING_TEASER.title}
          lede={PRICING_TEASER.lede}
        />
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {PRICING_TEASER.plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <article
                className={cn(
                  'pm-card h-full p-8 text-center',
                  p.popular && 'border-zinc-950/[0.16] shadow-[0_24px_56px_-20px_rgba(9,9,11,0.22)]'
                )}
              >
                {p.popular && (
                  <span className="mb-4 inline-block rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                    Most popular
                  </span>
                )}
                <p className="text-[15px] font-semibold text-zinc-950">{p.name}</p>
                <p className="mt-3">
                  <span className="pm-stat-num">{p.price}</span>
                  <span className="pm-small"> / seat / mo</span>
                </p>
                <p className="pm-small mt-3">{p.tag}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200} className="mt-10 text-center">
          <Link href={PRICING_TEASER.cta.href} className="pm-btn pm-btn-secondary">
            {PRICING_TEASER.cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
          <RiskBullets className="mt-6 justify-center" />
        </Reveal>
      </div>
    </div>
  );
}

/* ── Risk reversal bullets ────────────────────────────── */
export function RiskBullets({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
      {RISK_BULLETS.map((r) => (
        <li
          key={r}
          className={cn(
            'inline-flex items-center gap-2 text-[13.5px] font-medium',
            dark ? 'text-zinc-300' : 'text-zinc-500'
          )}
        >
          <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
          {r}
        </li>
      ))}
    </ul>
  );
}

/* ── FAQ accordion ────────────────────────────────────── */
export function Faq({ items = FAQS, eyebrow = 'FAQ', title = 'Answers, before you ask.' }: { items?: readonly { q: string; a: string }[]; eyebrow?: string; title?: ReactNode }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="pm-section">
      <div className="pm-container-narrow">
        <SectionHead eyebrow={eyebrow} title={title} />
        <div className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 50}>
                <div className="pm-faq-item" data-open={isOpen}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-[16px] font-semibold text-zinc-950">{f.q}</span>
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                        isOpen ? 'rotate-180 border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-950/[0.12] text-zinc-500'
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pm-body px-6 pb-6">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Final CTA (dark) ─────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
      <div className="pm-container relative py-24 text-center sm:py-32">
        <Reveal>
          <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Get started</p>
          <h2 className="pm-h-section-dark mx-auto max-w-3xl">{FINAL_CTA.title}</h2>
          <p className="pm-lead-dark mx-auto mt-5 max-w-xl">{FINAL_CTA.lede}</p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={FINAL_CTA.primaryCta.href} className="pm-btn pm-btn-white">
              {FINAL_CTA.primaryCta.label} <ArrowRight className="h-4 w-4" />
            </a>
            <Link href={FINAL_CTA.secondaryCta.href} className="pm-btn pm-btn-ghostlight">
              {FINAL_CTA.secondaryCta.label}
            </Link>
          </div>
          <RiskBullets dark className="mt-8 justify-center" />
        </Reveal>
      </div>
    </section>
  );
}

/* ── Positioning strip ────────────────────────────────── */
export function PositioningStrip({ line }: { line: string }) {
  return (
    <div className="pm-divider bg-white">
      <div className="pm-container py-12 sm:py-14">
        <Reveal>
          <p className="mx-auto max-w-3xl text-center font-display text-[clamp(1.3rem,2.6vw,1.8rem)] font-medium leading-snug tracking-[-0.015em] text-zinc-800">
            {line}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ── Secondary page hero ──────────────────────────────── */
export function PageHero({
  eyebrow,
  title,
  lede,
  cta,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  cta?: { label: string; href: string };
}) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-36 sm:pb-20 sm:pt-44 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
        <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
      </div>
      <div className="pm-container-narrow relative text-center">
        <Reveal>
          <p className="pm-eyebrow pm-eyebrow-centered">{eyebrow}</p>
          <h1 className="pm-h-display !text-[clamp(2.4rem,5vw,3.9rem)]">{title}</h1>
          {lede && <p className="pm-lead mx-auto mt-6 max-w-2xl">{lede}</p>}
          {cta && (
            <div className="mt-9">
              <a href={cta.href} className="pm-btn pm-btn-primary">
                {cta.label} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
