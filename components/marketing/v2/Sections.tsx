'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Phone, PhoneCall, Plug2, Zap } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from './copy';
import { FAQS, FINAL_CTA, HOW_IT_WORKS, PERSONAS, PRICING_TEASER, PROOF, RISK_BULLETS, STACK_BAND, TRUST } from './copy';
import {
  AiBrief,
  BrowserFrame,
  LiveBadge,
  NumberHealth,
  PowerQueue,
  TranscriptStream,
} from './Mockups';
import {
  Aurora,
  Counter,
  GlowCard,
  GradientBorder,
  Magnetic,
  Marquee,
  Noise,
  usePrefersReducedMotion,
} from './motion';
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
                <div className="mx-visual">{row.visual}</div>
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
            <Reveal key={p.role} delay={i * 80} className="h-full">
              <GlowCard className="pm-card pm-card-hover flex h-full flex-col p-7">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#6d28d9]">{p.role}</p>
                <h3 className="pm-h-card mt-4">{p.headline}</h3>
                <p className="pm-body mt-3 flex-1 !text-[14.5px]">{p.body}</p>
              </GlowCard>
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
      <div aria-hidden className="mx-dark-sheen" />
      <Aurora dark className="opacity-70" />
      <div className="pm-container pm-section relative">
        <SectionHead dark eyebrow={TRUST.eyebrow} title={TRUST.title} lede={TRUST.lede} />
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST.items.map((t, i) => (
            <Reveal key={t.title} delay={i * 90} className="h-full">
              <GlowCard className="pm-card-dark h-full p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  {i === 0 ? <PhoneCall className="h-5 w-5" /> : i === 1 ? <Plug2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                </span>
                <h3 className="mt-5 font-display text-[1.25rem] font-semibold tracking-tight text-white">{t.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-400">{t.body}</p>
              </GlowCard>
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

/* ── Stack band (honest integrations) ───────────────────
   HubSpot is the only Live connector — every other pill carries its
   real status so nothing implies equal availability. */
const STACK_STATUS = {
  live: { dot: 'bg-emerald-500', label: 'Live', text: 'text-emerald-700' },
  dev: { dot: 'bg-[#6d28d9]', label: 'In development', text: 'text-[#6d28d9]' },
  roadmap: { dot: 'bg-zinc-300', label: 'Roadmap', text: 'text-zinc-500' },
} as const;

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
            {STACK_BAND.items.map((item) => {
              const s = STACK_STATUS[item.status];
              return (
                <span key={item.name} className="pm-chip !gap-2.5 !px-5 !py-2.5 !text-[14px]">
                  <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
                  {item.name}
                  <span className={cn('text-[10.5px] font-bold uppercase tracking-[0.1em]', s.text)}>
                    {s.label}
                  </span>
                </span>
              );
            })}
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
            <Reveal key={p.name} delay={i * 90} className="h-full">
              {p.popular ? (
                <GradientBorder className="h-full">
                  <article className="pm-card h-full border-0 p-8 text-center shadow-none">
                    <span className="mb-4 inline-block rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                      Most popular
                    </span>
                    <p className="text-[15px] font-semibold text-zinc-950">{p.name}</p>
                    <p className="mt-3">
                      <span className="pm-stat-num">{p.price}</span>
                      <span className="pm-small"> / seat / mo</span>
                    </p>
                    <p className="pm-small mt-1.5 !text-[12px] text-zinc-400">per month, billed annually</p>
                    <p className="pm-small mt-3">{p.tag}</p>
                  </article>
                </GradientBorder>
              ) : (
                <article className="pm-card h-full p-8 text-center">
                  <p className="text-[15px] font-semibold text-zinc-950">{p.name}</p>
                  <p className="mt-3">
                    <span className="pm-stat-num">{p.price}</span>
                    <span className="pm-small"> / seat / mo</span>
                  </p>
                  <p className="pm-small mt-1.5 !text-[12px] text-zinc-400">per month, billed annually</p>
                  <p className="pm-small mt-3">{p.tag}</p>
                </article>
              )}
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
export function Faq({ items = FAQS, eyebrow = 'FAQ', title = 'Straight answers.' }: { items?: readonly { q: string; a: string }[]; eyebrow?: string; title?: ReactNode }) {
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

/* ── Final CTA (dark) ───────────────────────────────────
   Accepts optional overrides so each page can close with its own line;
   defaults preserve the shared FINAL_CTA for every existing caller. */
export function FinalCta({
  eyebrow = 'Get started',
  title = FINAL_CTA.title,
  lede = FINAL_CTA.lede,
  primaryCta = FINAL_CTA.primaryCta,
  secondaryCta = FINAL_CTA.secondaryCta,
}: {
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
} = {}) {
  return (
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
      <div aria-hidden className="mx-dark-sheen" />
      <Aurora dark className="opacity-70" />
      <Noise className="mx-noise-light" opacity={0.06} />
      <div className="pm-container relative py-24 text-center sm:py-32">
        <Reveal>
          <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">{eyebrow}</p>
          <h2 className="pm-h-section-dark mx-auto max-w-3xl">{title}</h2>
          <p className="pm-lead-dark mx-auto mt-5 max-w-xl">{lede}</p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic strength={14} className="w-full sm:w-auto">
              <a href={primaryCta.href} className="pm-btn pm-btn-white w-full sm:w-auto">
                {primaryCta.label} <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
            <Magnetic strength={14} className="w-full sm:w-auto">
              <Link href={secondaryCta.href} className="pm-btn pm-btn-ghostlight w-full sm:w-auto">
                {secondaryCta.label}
              </Link>
            </Magnetic>
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
        <Aurora />
        <Noise />
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
              <Magnetic strength={14}>
                <a href={cta.href} className="pm-btn pm-btn-primary">
                  {cta.label} <ArrowRight className="h-4 w-4" />
                </a>
              </Magnetic>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* ── Capability marquee (honest feature strip, no logos) ── */
const CAPABILITIES = [
  'Power dialing',
  'Parallel dialing',
  'Click-to-call',
  'AI call briefs',
  'Live transcription',
  'Sentiment analysis',
  'Number health scoring',
  'Voicemail drop',
  'Call recordings',
  'DNC respect',
];

export function CapabilityMarquee() {
  return (
    <div className="border-b border-zinc-950/[0.07] bg-white py-5">
      <Marquee items={CAPABILITIES} label="GrowthDialer capabilities" />
    </div>
  );
}

/* ── Honest product stats with animated counters ─────────
   Every number is a verifiable product fact — no traction,
   revenue, or user counts are claimed anywhere. */
const HONEST_STATS = [
  { to: 3, suffix: '', label: 'Dialing modes — power, parallel, click-to-call' },
  { to: 8, suffix: '', label: 'One-click dispositions per call' },
  { to: 20, suffix: '%', label: 'Saved with annual billing' },
  { to: 7, suffix: '-day', label: 'Free trial — no credit card' },
];

export function StatsRow() {
  return (
    <div className="pm-section-tight pm-divider bg-white">
      <div className="pm-container">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {HONEST_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center">
              <Counter to={s.to} suffix={s.suffix} className="pm-stat-num" />
              <p className="pm-stat-label mx-auto max-w-[220px]">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Pinned showcase: the voice-AI story in 3 scroll steps
   Desktop: one pinned/sticky section, visuals crossfade as you scroll.
   Mobile + reduced-motion: calm stacked cards, no pinning. */
type ShowcaseStep = {
  label: string;
  title: string;
  body: string;
  url: string;
  badge: string;
  visual: ReactNode;
};

const SHOWCASE_STEPS: ShowcaseStep[] = [
  {
    label: 'Talk',
    title: 'Reps stay in conversation',
    body: 'Power and parallel dialing keep the line moving — the next call starts the second the last one is dispositioned.',
    url: 'app.growthdialer.com/dialer',
    badge: 'Power session · live',
    visual: <PowerQueue />,
  },
  {
    label: 'Transcribe',
    title: 'Every word, captured live',
    body: 'Calls are transcribed as they happen, with buying signals and objections flagged the moment they surface.',
    url: 'app.growthdialer.com/calls/rec_8f3k2',
    badge: 'Transcribing · live',
    visual: <TranscriptStream />,
  },
  {
    label: 'Brief',
    title: 'Notes write themselves',
    body: 'A 30-second brief — summary, objections, next steps — ready before your rep reaches for the keyboard.',
    url: 'app.growthdialer.com/calls/rec_8f3k2',
    badge: 'Brief ready · 8s after hang-up',
    visual: <AiBrief />,
  },
];

function PhaseVisual({
  index,
  progress,
  hidden,
  step,
}: {
  index: number;
  progress: MotionValue<number>;
  hidden: boolean;
  step: ShowcaseStep;
}) {
  const start = index / SHOWCASE_STEPS.length;
  const end = (index + 1) / SHOWCASE_STEPS.length;
  const isLast = index === SHOWCASE_STEPS.length - 1;
  /* Sequential cross-fade: each phase fully exits before the next enters,
     so two browser frames never visibly collide mid-transition. The final
     phase stays put instead of fading to blank at the end of the pin. */
  const opacity = useTransform(
    progress,
    isLast
      ? [Math.max(0, start - 0.02), start + 0.1]
      : [Math.max(0, start - 0.02), start + 0.1, end - 0.16, end - 0.06],
    isLast ? [0, 1] : [0, 1, 1, 0]
  );
  const y = useTransform(progress, [start, start + 0.12, end - 0.12, end], [48, 0, 0, -48]);
  const scale = useTransform(progress, [start, start + 0.12, end - 0.12, end], [0.96, 1, 1, 0.98]);
  return (
    <motion.div
      aria-hidden={hidden}
      className={cn('absolute inset-0 flex items-center', hidden && 'pointer-events-none')}
      style={{ opacity, y, scale }}
    >
      <div className="w-full">
        <BrowserFrame url={step.url} badge={<LiveBadge label={step.badge} />}>
          {step.visual}
        </BrowserFrame>
      </div>
    </motion.div>
  );
}

function ShowcaseCopy({ active, railScale }: { active: number; railScale?: MotionValue<number> }) {
  return (
    <div>
      <p className="pm-eyebrow">AI intelligence</p>
      <h2 className="pm-h-section">The call writes its own notes.</h2>
      <div className="mx-pinned-rail relative mt-8 space-y-7">
        {railScale && <motion.span aria-hidden className="mx-pinned-fill" style={{ scaleY: railScale }} />}
        {SHOWCASE_STEPS.map((s, i) => (
          <div key={s.label} className="mx-step flex gap-5" data-active={active === i}>
            <span className="mx-step-dot mt-1" aria-hidden />
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6d28d9]">
                {String(i + 1).padStart(2, '0')} · {s.label}
              </p>
              <h3 className="pm-h-card mt-1.5">{s.title}</h3>
              <p className="pm-body mt-1.5 max-w-sm !text-[14px]">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseStatic() {
  return (
    <div className="pm-section">
      <div className="pm-container">
        <ShowcaseCopy active={2} />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {SHOWCASE_STEPS.map((s) => (
            <Reveal key={s.label} variant="scale">
              <BrowserFrame url={s.url} badge={<LiveBadge label={s.badge} />}>
                {s.visual}
              </BrowserFrame>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PinnedShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(SHOWCASE_STEPS.length - 1, Math.max(0, Math.floor(v * SHOWCASE_STEPS.length))));
  });
  const railScale = useTransform(scrollYProgress, [0.08, 0.92], [0, 1]);

  return (
    <section className="pm-divider relative bg-white">
      {/* mobile / reduced-motion: calm stacked cards */}
      <div className="lg:hidden">
        <ShowcaseStatic />
      </div>

      {/* desktop: pinned sticky showcase */}
      <div ref={ref} className="relative hidden lg:block" style={reduced ? undefined : { height: '340vh' }}>
        {reduced ? (
          <ShowcaseStatic />
        ) : (
          <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-16">
            <div className="pm-container grid w-full items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
              <ShowcaseCopy active={active} railScale={railScale} />
              <div className="relative h-[500px] xl:h-[560px]">
                {SHOWCASE_STEPS.map((s, i) => (
                  <PhaseVisual key={s.label} index={i} progress={scrollYProgress} hidden={active !== i} step={s} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ Homepage-only section variants ═══════════════════════
   These break the eyebrow→headline→copy→checks→mockup rhythm:
   a truthful proof band, a dialing bento, one dark intelligence
   band, and a full-width deliverability visual. Existing exports
   above are untouched for the pages that already use them. */

/* ── Truthful proof band: four pillars, honest statuses ── */
export function ProofBand() {
  return (
    <div className="pm-section-tight pm-divider bg-white">
      <div className="pm-container">
        <SectionHead eyebrow={PROOF.eyebrow} title={PROOF.title} lede={PROOF.lede} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROOF.pillars.map((p, i) => {
            const live = p.status === 'live';
            return (
              <Reveal key={p.name} delay={i * 80} className="h-full">
                <article
                  className={cn(
                    'h-full rounded-[1.4rem] border p-6',
                    live
                      ? 'pm-card'
                      : 'border-dashed border-[#6d28d9]/40 bg-[#6d28d9]/[0.03]'
                  )}
                >
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                    <span
                      aria-hidden
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        live ? 'pm-pulse-dot bg-emerald-500' : 'bg-[#6d28d9]'
                      )}
                    />
                    <span className={live ? 'text-emerald-700' : 'text-[#6d28d9]'}>
                      {live ? 'Live' : 'In development'}
                    </span>
                  </p>
                  <h3 className="mt-3 font-display text-[1.2rem] font-semibold tracking-tight text-zinc-950">
                    {p.name}
                  </h3>
                  <p className="mt-1 font-mono text-[11.5px] font-medium text-zinc-500">{p.fact}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-600">{p.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={160}>
          <p className="mx-auto mt-10 max-w-3xl text-center font-mono text-[12.5px] font-medium tracking-wide text-zinc-500">
            {PROOF.facts.map((f, i) => (
              <span key={f}>
                {i > 0 && (
                  <span aria-hidden className="mx-3 font-bold text-[#6d28d9]">
                    ·
                  </span>
                )}
                {f}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ── Dialing bento: three modes, three different tiles ──── */
function BentoTicks({ items, dark = false }: { items: readonly string[]; dark?: boolean }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((b) => (
        <li key={b} className={cn('pm-tick', dark && 'text-zinc-300')}>
          <span
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-500/12 text-emerald-700'
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

export function ModesBento({
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
  const [power, parallel, click] = rows;
  return (
    <div className="pm-section">
      <div className="pm-container">
        <SectionHead eyebrow={eyebrow} title={title} lede={lede} align="left" />
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Parallel — the signature tile, spans both rows */}
          {parallel && (
            <Reveal className="h-full lg:row-span-2">
              <article className="pm-card pm-card-hover flex h-full flex-col overflow-hidden p-7 sm:p-8">
                <p className="pm-eyebrow !mb-3">{parallel.eyebrow}</p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-tight text-zinc-950">
                  {parallel.title}
                </h3>
                <p className="pm-body mt-4 max-w-md">{parallel.body}</p>
                <BentoTicks items={parallel.bullets} />
                <div className="mx-visual mt-8">{parallel.visual}</div>
              </article>
            </Reveal>
          )}

          {/* Power — compact tile with a live session strip */}
          {power && (
            <Reveal delay={100} className="h-full">
              <article className="pm-card pm-card-hover h-full p-7 sm:p-8">
                <p className="pm-eyebrow !mb-3">{power.eyebrow}</p>
                <h3 className="pm-h-card">{power.title}</h3>
                <p className="pm-body mt-3">{power.body}</p>
                <div className="mt-6 rounded-2xl border border-zinc-950/[0.07] bg-zinc-50/70 p-4">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-zinc-900">Power session · Q3 follow-ups</span>
                    <span className="font-mono font-semibold text-[#6d28d9]">47 / 200</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-950/[0.07]">
                    <div className="h-full w-[23%] rounded-full bg-[#6d28d9]" />
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6d28d9] text-[12px] font-bold text-white">
                      SM
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-zinc-900">Sales Manager</p>
                      <p className="truncate text-[11.5px] text-zinc-500">Calling now…</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#6d28d9] px-3 py-1.5 text-[11px] font-semibold text-white">
                      <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-white" /> Calling
                    </span>
                  </div>
                </div>
                <BentoTicks items={power.bullets} />
              </article>
            </Reveal>
          )}

          {/* Click-to-call — compact tile with a one-tap row */}
          {click && (
            <Reveal delay={180} className="h-full">
              <article className="pm-card pm-card-hover h-full p-7 sm:p-8">
                <p className="pm-eyebrow !mb-3">{click.eyebrow}</p>
                <h3 className="pm-h-card">{click.title}</h3>
                <p className="pm-body mt-3">{click.body}</p>
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-950/[0.07] bg-zinc-50/70 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-zinc-900">VP Sales</p>
                    <p className="truncate text-[12px] text-zinc-500">Enterprise · Outbound</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d28d9] text-white shadow-[0_8px_20px_-6px_rgba(109,40,217,0.6)]">
                    <Phone className="h-4 w-4" />
                  </span>
                </div>
                <p className="pm-small mt-3">One click on any number — in your list, your CRM, anywhere.</p>
                <BentoTicks items={click.bullets} />
              </article>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Dark intelligence band: "mission control" ────────────
   The single dark mid-page section — violet-tinted to stand apart
   from the neutral-dark trust band and final CTA. */
export function DarkIntelligence({
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
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(124,58,237,0.24),transparent_70%)]"
      />
      <div aria-hidden className="mx-dark-sheen" />
      <Aurora dark className="opacity-60" />
      <div className="pm-container pm-section relative">
        <SectionHead dark eyebrow={eyebrow} title={title} lede={lede} />
        <div className="grid gap-5 lg:grid-cols-3">
          {rows.map((row, i) => (
            <Reveal key={row.title} delay={i * 100} className="h-full">
              <article className="flex h-full flex-col rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
                <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  {row.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-[1.35rem] font-semibold tracking-tight text-white">
                  {row.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-400">{row.body}</p>
                <BentoTicks dark items={row.bullets} />
                <div className="mt-6">{row.visual}</div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-center text-[14px] text-zinc-400">
            The fourth pillar — the AI receptionist — is still in the lab.{' '}
            <Link href="/roadmap" className="font-semibold text-violet-300 underline-offset-4 hover:underline">
              See the roadmap <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Deliverability: full-width visual band ─────────────── */
export function DeliverabilityBand({
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
    <div className="pm-section bg-white">
      <div className="pm-container">
        <SectionHead eyebrow={eyebrow} title={title} lede={lede} align="left" />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {rows.map((row, i) => (
            <Reveal key={row.title} delay={i * 100}>
              <p className="pm-eyebrow !mb-3">{row.eyebrow}</p>
              <h3 className="pm-h-group">{row.title}</h3>
              <p className="pm-body mt-4 max-w-lg">{row.body}</p>
              <BentoTicks items={row.bullets} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={120} variant="scale" className="mt-12">
          <BrowserFrame
            url="app.growthdialer.com/numbers"
            badge={<LiveBadge label="Monitoring · live" />}
          >
            <NumberHealth />
          </BrowserFrame>
        </Reveal>
      </div>
    </div>
  );
}
