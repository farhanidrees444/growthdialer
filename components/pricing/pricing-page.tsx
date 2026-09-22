'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Minus, ShieldCheck } from 'lucide-react';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { PLAN_ORDER, PLAN_LABELS, type FeatureKey, type PlanKey } from '@/lib/plan/plan-gates';
import { usePlan } from '@/lib/plan/use-plan';
import { cn } from '@/lib/utils';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { Faq, RiskBullets, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';

type PaidPlan = 'starter' | 'growth' | 'pro';
type Cycle = 'monthly' | 'annual';

const PAID_PLANS: PaidPlan[] = ['starter', 'growth', 'pro'];

const PRICE = {
  starter: { monthly: 49, annual: 39, annualBilled: 468 },
  growth: { monthly: 79, annual: 63, annualBilled: 756 },
  pro: { monthly: 119, annual: 95, annualBilled: 1140 },
} as const;

const PLAN_COPY = {
  starter: {
    title: 'Starter',
    eyebrow: 'Solo reps',
    description: 'Everything needed to dial, record, transcribe, and sync calls.',
    features: ['AI dialer', 'Unlimited calls', 'Recordings and transcripts', '1 local number', 'CRM sync · waitlist'],
  },
  growth: {
    title: 'Growth',
    eyebrow: 'Growing sales teams',
    description: 'Adds call scoring, summaries, sequences, and coaching dashboards.',
    features: ['AI call scoring', 'Post-call summaries', 'Coaching dashboard', 'Sequences · coming soon', 'Leaderboard'],
  },
  pro: {
    title: 'Pro',
    eyebrow: 'High-volume teams',
    description: 'Live floor visibility, advanced coaching controls, API access, and priority support.',
    features: ['Live monitor', 'Whisper, barge, takeover · coming soon', 'Weekly coaching reports', 'API and webhooks', 'Priority support'],
  },
} as const;

const FEATURE_ROWS: Array<{ section: string; rows: Array<{ label: string; key?: FeatureKey; values?: Record<PaidPlan, string | boolean> }> }> = [
  {
    section: 'Dialing',
    rows: [
      { label: 'AI dialer', key: 'ai_dialer' },
      { label: 'Unlimited calls', key: 'unlimited_calls' },
      { label: 'Voicemail detection', key: 'voicemail_detection' },
      { label: 'Local numbers', values: { starter: '1', growth: '3', pro: 'Unlimited' } },
      { label: 'Sequences', key: 'sequences' },
    ],
  },
  {
    section: 'AI Intelligence',
    rows: [
      { label: 'Recordings', key: 'recordings' },
      { label: 'Transcripts', key: 'transcripts' },
      { label: 'AI call scoring', key: 'ai_call_scoring' },
      { label: 'Post-call summaries', key: 'post_call_summaries' },
    ],
  },
  {
    section: 'Coaching',
    rows: [
      { label: 'Coaching dashboard', key: 'coaching_dashboard' },
      { label: 'Live monitor', key: 'live_monitor' },
      { label: 'Whisper, barge, takeover', key: 'whisper_barge_takeover' },
      { label: 'Weekly coaching reports', key: 'weekly_coaching_reports' },
      { label: 'Self-coaching view', key: 'self_coaching_view' },
    ],
  },
  {
    section: 'Team',
    rows: [
      { label: 'Leaderboard', key: 'leaderboard' },
      { label: 'CRM sync', key: 'crm_sync' },
      { label: 'Priority support', key: 'priority_support' },
    ],
  },
  {
    section: 'Platform',
    rows: [
      { label: 'API access', key: 'api_access' },
      { label: 'Webhooks', key: 'webhooks' },
      { label: 'Advanced integrations', key: 'integrations_nango' },
    ],
  },
];

const COMPETITORS = [
  { name: 'Orum', note: 'Enterprise sales floor tooling' },
  { name: 'Nooks', note: 'AI dialing for larger teams' },
  { name: 'PhoneBurner', note: 'Power dialing with annual commitments' },
  { name: 'Kixie', note: 'Calling and SMS for CRM workflows' },
  { name: 'GrowthDialer', note: 'AI dialer, coaching, and no annual lock-in', highlight: true },
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes. Paid plans include a 7-day free trial and do not require a credit card to start.' },
  { q: 'Can I pay monthly?', a: 'Yes. Monthly plans are available, and annual billing saves 20%.' },
  { q: 'Can I change seats later?', a: 'Yes. Choose the seat count at checkout and adjust as your team changes.' },
  { q: 'What happens if I downgrade?', a: 'Your data stays available, but premium features lock based on your current plan.' },
  { q: 'Do you require annual contracts?', a: 'No. You can choose monthly billing without an annual lock-in.' },
  { q: 'Which plan includes coaching?', a: 'Growth includes coaching dashboards and leaderboards. Pro adds live monitoring and manager controls. Whisper and barge coaching are coming soon.' },
  { q: 'Are CRM integrations live?', a: 'Not yet — native CRM integrations are in development and currently waitlist-only. Recordings, transcripts, and disposition history are stored in your workspace and exportable today.' },
] as const;

function planIndex(plan: PlanKey) {
  return PLAN_ORDER.indexOf(plan);
}

/**
 * Honesty overrides: sequences are a placeholder (coming soon),
 * whisper/barge coaching audio is roadmap (coming soon), and all CRM
 * integrations are waitlist-only.
 */
function included(plan: PaidPlan, row: { key?: FeatureKey; values?: Record<PaidPlan, string | boolean> }) {
  if (row.key === 'crm_sync') return 'Waitlist';
  if (row.key === 'sequences') return plan === 'starter' ? false : 'Coming soon';
  if (row.key === 'whisper_barge_takeover') return plan === 'pro' ? 'Coming soon' : false;
  if (row.values) return row.values[plan];
  if (!row.key) return false;
  const value = {
    starter: {
      ai_dialer: true,
      unlimited_calls: true,
      recordings: true,
      transcripts: true,
      voicemail_detection: true,
      local_numbers_limit: 1,
      crm_sync: true,
      ai_call_scoring: false,
      post_call_summaries: false,
      coaching_dashboard: false,
      live_monitor: false,
      whisper_barge_takeover: false,
      sequences: false,
      leaderboard: false,
      weekly_coaching_reports: false,
      api_access: false,
      webhooks: false,
      self_coaching_view: false,
      integrations_nango: false,
      priority_support: false,
    },
    growth: {
      ai_dialer: true,
      unlimited_calls: true,
      recordings: true,
      transcripts: true,
      voicemail_detection: true,
      local_numbers_limit: 3,
      crm_sync: true,
      ai_call_scoring: true,
      post_call_summaries: true,
      coaching_dashboard: true,
      live_monitor: false,
      whisper_barge_takeover: false,
      sequences: true,
      leaderboard: true,
      weekly_coaching_reports: false,
      api_access: false,
      webhooks: false,
      self_coaching_view: false,
      integrations_nango: false,
      priority_support: false,
    },
    pro: {
      ai_dialer: true,
      unlimited_calls: true,
      recordings: true,
      transcripts: true,
      voicemail_detection: true,
      local_numbers_limit: -1,
      crm_sync: true,
      ai_call_scoring: true,
      post_call_summaries: true,
      coaching_dashboard: true,
      live_monitor: true,
      whisper_barge_takeover: true,
      sequences: true,
      leaderboard: true,
      weekly_coaching_reports: true,
      api_access: true,
      webhooks: true,
      self_coaching_view: true,
      integrations_nango: true,
      priority_support: true,
    },
  }[plan][row.key];
  return typeof value === 'number' ? (value === -1 ? 'Unlimited' : String(value)) : value;
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      {label}
    </span>
  );
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'string') {
    if (value === 'Coming soon' || value === 'Waitlist') {
      return (
        <div className="flex justify-center">
          <StatusChip label={value} />
        </div>
      );
    }
    return <span className="text-sm font-medium text-zinc-700">{value}</span>;
  }
  return value
    ? <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} />
    : <Minus className="mx-auto h-4 w-4 text-zinc-300" />;
}

function PlanCard({
  plan,
  cycle,
  currentPlan,
  seats,
  setSeats,
}: {
  plan: PaidPlan;
  cycle: Cycle;
  currentPlan: PlanKey;
  seats: number;
  setSeats: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlighted = searchParams.get('highlight') === plan;
  const unit = PRICE[plan][cycle];
  const total = unit * seats;
  const current = currentPlan === plan;
  const lower = planIndex(currentPlan) > planIndex(plan);
  // Billing bypass: checkout is disabled until BILLING_ENABLED=true — every
  // CTA routes through signup; the plan/seat/cycle selection is preserved.
  const signupUrl = `/signup?plan=${plan}&seats=${seats}&cycle=${cycle}`;

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted]);

  // Billing bypass: no checkout exists yet — every CTA starts a free trial.
  const cta = current ? 'Current plan' : lower ? 'Included in your plan' : 'Start free trial';

  return (
    <motion.div
      ref={ref}
      id={`plan-${plan}`}
      animate={highlighted ? { boxShadow: ['0 0 0 rgba(109,40,217,0)', '0 0 44px rgba(109,40,217,0.28)', '0 0 0 rgba(109,40,217,0)'] } : undefined}
      transition={{ duration: 1.6, repeat: highlighted ? 2 : 0 }}
      className={cn(
        'pm-card relative flex h-full flex-col p-8',
        plan === 'growth' && 'border-zinc-950/[0.16] shadow-[0_24px_56px_-20px_rgba(9,9,11,0.22)] ring-1 ring-zinc-950/[0.06]',
      )}
    >
      {plan === 'growth' && (
        <div className="absolute -top-3 left-8 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
          Most popular
        </div>
      )}
      {current && (
        <div className="absolute right-6 top-6 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
          Current plan
        </div>
      )}

      <p className="pm-eyebrow !mb-3">{PLAN_COPY[plan].eyebrow}</p>
      <h2 className="pm-h-card !text-2xl">{PLAN_COPY[plan].title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-zinc-500">{PLAN_COPY[plan].description}</p>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan}-${cycle}-${unit}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className="font-display text-5xl font-semibold tracking-tight text-zinc-950 tabular-nums"
            >
              ${unit}
            </motion.span>
          </AnimatePresence>
          <span className="pb-2 text-sm text-zinc-500">/ seat / mo</span>
        </div>
        {cycle === 'annual' && (
          <p className="mt-2 text-xs text-zinc-500">Billed ${PRICE[plan].annualBilled.toLocaleString()} per seat annually.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-950/[0.08] bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">Seats</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Fewer seats" onClick={() => setSeats(Math.max(1, seats - 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-950/[0.10] bg-white text-zinc-600 transition hover:border-zinc-950/25">-</button>
            <span className="w-8 text-center text-sm font-semibold text-zinc-950 tabular-nums">{seats}</span>
            <button type="button" aria-label="More seats" onClick={() => setSeats(seats + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-950/[0.10] bg-white text-zinc-600 transition hover:border-zinc-950/25">+</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Total: <span className="font-semibold text-zinc-950 tabular-nums">${total.toLocaleString()}</span> / month
        </p>
      </div>

      <ul className="mt-6 space-y-2.5">
        {PLAN_COPY[plan].features.map((feature) => (
          <li key={feature} className="pm-tick">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={current || lower ? '/dashboard' : signupUrl}
        aria-disabled={current}
        className={cn('pm-btn mt-8 w-full justify-center', current || lower ? 'pm-btn-secondary pointer-events-none opacity-60' : 'pm-btn-primary')}
      >
        {cta} {!current && !lower && <ArrowRight className="h-4 w-4" />}
      </Link>
    </motion.div>
  );
}

export function PricingPage() {
  const session = useSupabaseSession();
  const { plan: currentPlan } = usePlan();
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [seats, setSeats] = useState<Record<PaidPlan, number>>({ starter: 1, growth: 1, pro: 1 });

  void session;

  const seatSetter = useMemo(() => ({
    starter: (value: number) => setSeats((prev) => ({ ...prev, starter: value })),
    growth: (value: number) => setSeats((prev) => ({ ...prev, growth: value })),
    pro: (value: number) => setSeats((prev) => ({ ...prev, pro: value })),
  }), []);

  return (
    <main>
      {/* Hero — clean editorial, no decorative blob/grid */}
      <section className="relative overflow-hidden border-b border-zinc-950/[0.07] px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
        <div className="pm-container-narrow relative">
          <Reveal>
            <p className="pm-eyebrow font-mono">Pricing</p>
            <h1 className="pm-h-display mt-5 max-w-2xl">Pricing that scales with your sales floor.</h1>
            <p className="pm-lead mt-6 max-w-2xl">
              Start with core dialing, then add AI scoring, coaching, live floor controls, and platform access as your team grows. 7-day free trial — no credit card.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 inline-flex rounded-full border border-zinc-950/[0.10] bg-white p-1 shadow-sm">
              {(['monthly', 'annual'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCycle(item)}
                  className={cn('relative rounded-full px-5 py-2 text-sm font-semibold transition', cycle === item ? 'text-white' : 'text-zinc-500 hover:text-zinc-800')}
                >
                  {cycle === item && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-zinc-950" />}
                  <span className="relative z-10 capitalize">{item}</span>
                  {item === 'annual' && (
                    <span className={cn('relative z-10 ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold', cycle === item ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-100 text-emerald-800')}>
                      Save 20%
                    </span>
                  )}
                </button>
              ))}
            </div>
            <RiskBullets className="mt-6 justify-center" />
          </Reveal>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pm-container pb-4">
        <div className="grid gap-5 lg:grid-cols-3">
          {PAID_PLANS.map((plan, i) => (
            <Reveal key={plan} delay={i * 90} className="h-full">
              <PlanCard
                plan={plan}
                cycle={cycle}
                currentPlan={currentPlan}
                seats={seats[plan]}
                setSeats={seatSetter[plan]}
              />
            </Reveal>
          ))}
        </div>
        <p className="pm-caption mt-6 text-center">
          All prices per seat, USD. Annual plans billed once per year. Every plan includes unlimited calling workflows and AI summaries on recorded calls.
        </p>
      </section>

      {/* Feature comparison */}
      <section className="pm-section-tight">
        <div className="pm-container">
          <SectionHead eyebrow="Compare plans" title="Everything, line by line." />
          <Reveal>
            <div className="pm-card overflow-hidden !p-0">
              <div className="grid grid-cols-[1.3fr_repeat(3,1fr)] border-b border-zinc-950/[0.08] bg-zinc-50/70 px-5 py-4 text-sm font-semibold text-zinc-950">
                <span>Feature</span>
                {PAID_PLANS.map((plan) => <span key={plan} className="text-center">{PLAN_LABELS[plan]}</span>)}
              </div>
              {FEATURE_ROWS.map((group) => (
                <div key={group.section}>
                  <div className="bg-zinc-50/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d28d9]">
                    {group.section}
                  </div>
                  {group.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[1.3fr_repeat(3,1fr)] items-center border-t border-zinc-950/[0.06] px-5 py-3.5">
                      <span className="text-sm text-zinc-700">{row.label}</span>
                      {PAID_PLANS.map((plan) => (
                        <div key={plan} className="text-center">
                          <FeatureValue value={included(plan, row)} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="pm-section-tight pm-divider bg-zinc-50/60">
        <div className="pm-container">
          <Reveal>
            <div className="mb-8 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#6d28d9]" />
              <h2 className="pm-h-group !text-[1.6rem]">How GrowthDialer compares</h2>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COMPETITORS.map((item, i) => (
              <Reveal key={item.name} delay={i * 60}>
                <div className={cn('pm-card h-full p-5', item.highlight && 'border-zinc-950/[0.16] shadow-[0_18px_44px_-18px_rgba(9,9,11,0.25)]')}>
                  {item.highlight && (
                    <span className="mb-3 inline-block rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      This is us
                    </span>
                  )}
                  <p className="font-semibold text-zinc-950">{item.name}</p>
                  <p className="pm-small mt-1.5">{item.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="pm-caption mt-6 text-center">
            Neutral notes on public positioning — verify pricing and features with each vendor before buying.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <div className="pm-divider">
        <Faq items={FAQS} eyebrow="Pricing FAQ" title="Questions before you start?" />
      </div>

      {/* Final CTA */}
      <section className="pm-dark">
        <div aria-hidden className="pm-dark-grid absolute inset-0" />
        <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
        <div className="pm-container relative py-24 text-center sm:py-32">
          <Reveal>
            <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Get started</p>
            <h2 className="pm-h-section-dark mx-auto max-w-3xl">Try the dialer on your own calls.</h2>
            <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
              Seven days, no credit card. If it doesn&apos;t earn its seat, cancel in one click.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                Start free trial <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/demo" className="pm-btn pm-btn-ghostlight">
                See the demo
              </Link>
            </div>
            <RiskBullets dark className="mt-8 justify-center" />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
