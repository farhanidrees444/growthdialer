'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Minus, Sparkles, ShieldCheck } from 'lucide-react';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { PLAN_ORDER, PLAN_LABELS, type FeatureKey, type PlanKey } from '@/lib/plan/plan-gates';
import { usePlan } from '@/lib/plan/use-plan';
import { cn } from '@/lib/utils';

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
    features: ['AI dialer', 'Unlimited calls', 'Recordings and transcripts', '1 local number', 'CRM sync'],
  },
  growth: {
    title: 'Growth',
    eyebrow: 'Growing sales teams',
    description: 'Adds call scoring, summaries, sequences, and coaching dashboards.',
    features: ['AI call scoring', 'Post-call summaries', 'Coaching dashboard', 'Sequences', 'Leaderboard'],
  },
  pro: {
    title: 'Pro',
    eyebrow: 'High-volume teams',
    description: 'Live floor visibility, advanced coaching controls, API access, and priority support.',
    features: ['Live monitor', 'Whisper, barge, takeover', 'Weekly coaching reports', 'API and webhooks', 'Priority support'],
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
  ['Is there a free trial?', 'Yes. Paid plans include a 7-day free trial and do not require a credit card to start.'],
  ['Can I pay monthly?', 'Yes. Monthly plans are available, and annual billing saves 20%.'],
  ['Can I change seats later?', 'Yes. Choose the seat count at checkout and adjust as your team changes.'],
  ['What happens if I downgrade?', 'Your data stays available, but premium features lock based on your current plan.'],
  ['Do you require annual contracts?', 'No. You can choose monthly billing without an annual lock-in.'],
  ['Which plan includes coaching?', 'Growth includes coaching dashboards and leaderboards. Pro adds live monitoring and manager controls.'],
] as const;

function planIndex(plan: PlanKey) {
  return PLAN_ORDER.indexOf(plan);
}

function included(plan: PaidPlan, row: { key?: FeatureKey; values?: Record<PaidPlan, string | boolean> }) {
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

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'string') return <span className="text-sm text-zinc-300">{value}</span>;
  return value
    ? <Check className="mx-auto h-4 w-4 text-[#06B6D4]" />
    : <Minus className="mx-auto h-4 w-4 text-zinc-700" />;
}

function PlanCard({
  plan,
  cycle,
  currentPlan,
  seats,
  setSeats,
  authenticated,
}: {
  plan: PaidPlan;
  cycle: Cycle;
  currentPlan: PlanKey;
  seats: number;
  setSeats: (value: number) => void;
  authenticated: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlighted = searchParams.get('highlight') === plan;
  const unit = PRICE[plan][cycle];
  const total = unit * seats;
  const current = currentPlan === plan;
  const lower = planIndex(currentPlan) > planIndex(plan);
  const checkoutUrl = `/api/checkout?plan=${plan}&seats=${seats}&cycle=${cycle}`;
  const signupUrl = `/signup?plan=${plan}&seats=${seats}&cycle=${cycle}&next=${encodeURIComponent(checkoutUrl)}`;

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted]);

  const cta = current ? 'Current plan' : lower ? 'Included in your plan' : authenticated ? 'Start checkout' : 'Start free trial';

  return (
    <motion.div
      ref={ref}
      id={`plan-${plan}`}
      animate={highlighted ? { boxShadow: ['0 0 0 rgba(139,92,246,0)', '0 0 44px rgba(139,92,246,0.35)', '0 0 0 rgba(139,92,246,0)'] } : undefined}
      transition={{ duration: 1.6, repeat: highlighted ? 2 : 0 }}
      className={cn(
        'relative flex flex-col rounded-[28px] border bg-white/[0.035] p-6 backdrop-blur-2xl',
        plan === 'growth' ? 'border-[#8B5CF6]/45 shadow-[0_24px_80px_rgba(139,92,246,0.16)]' : 'border-white/[0.09]',
      )}
    >
      {plan === 'growth' && (
        <div className="absolute -top-3 left-6 rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6] px-3 py-1 text-xs font-semibold text-white">
          Featured
        </div>
      )}
      {current && (
        <div className="absolute right-5 top-5 rounded-full border border-[#06B6D4]/25 bg-[#06B6D4]/10 px-2.5 py-1 text-[11px] font-semibold text-[#06B6D4]">
          Current plan
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#06B6D4]">{PLAN_COPY[plan].eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{PLAN_COPY[plan].title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-zinc-400">{PLAN_COPY[plan].description}</p>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan}-${cycle}-${unit}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className="font-display text-5xl font-semibold tracking-tight text-white tabular-nums"
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

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/25 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">Seats</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSeats(Math.max(1, seats - 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70">-</button>
            <span className="w-8 text-center text-sm font-semibold text-white tabular-nums">{seats}</span>
            <button type="button" onClick={() => setSeats(seats + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70">+</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Total: <span className="font-semibold text-white tabular-nums">${total.toLocaleString()}</span> / month
        </p>
      </div>

      <ul className="mt-6 space-y-2.5">
        {PLAN_COPY[plan].features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
            <Check className="h-4 w-4 text-[#06B6D4]" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={current || lower ? '/dashboard' : authenticated ? checkoutUrl : signupUrl}
        aria-disabled={current}
        className={cn(
          'mt-auto inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition',
          current || lower
            ? 'border border-white/[0.08] bg-white/[0.04] text-zinc-400'
            : 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-[0_18px_44px_rgba(139,92,246,0.28)] hover:brightness-110',
        )}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

export function PricingPage() {
  const session = useSupabaseSession();
  const { plan: currentPlan } = usePlan();
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [seats, setSeats] = useState<Record<PaidPlan, number>>({ starter: 1, growth: 1, pro: 1 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const authenticated = Boolean(session?.user);

  const seatSetter = useMemo(() => ({
    starter: (value: number) => setSeats((prev) => ({ ...prev, starter: value })),
    growth: (value: number) => setSeats((prev) => ({ ...prev, growth: value })),
    pro: (value: number) => setSeats((prev) => ({ ...prev, pro: value })),
  }), []);

  return (
    <div className="min-h-screen bg-[#08080A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.20),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.13),transparent_30%)]" />
      <main className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
            7-day free trial. No credit card.
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Pricing that scales with your sales floor
          </h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Start with core dialing, then add AI scoring, coaching, live floor controls, and platform access as your team grows.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-white/[0.10] bg-white/[0.04] p-1 backdrop-blur-xl">
            {(['monthly', 'annual'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCycle(item)}
                className={cn('relative rounded-full px-5 py-2 text-sm font-semibold transition', cycle === item ? 'text-white' : 'text-zinc-500')}
              >
                {cycle === item && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-[#8B5CF6]" />}
                <span className="relative z-10 capitalize">{item}</span>
                {item === 'annual' && <span className="relative z-10 ml-2 rounded-full bg-[#06B6D4]/20 px-2 py-0.5 text-[10px] text-[#67E8F9]">Save 20%</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          {PAID_PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              cycle={cycle}
              currentPlan={currentPlan}
              seats={seats[plan]}
              setSeats={seatSetter[plan]}
              authenticated={authenticated}
            />
          ))}
        </section>

        <section className="mt-16 overflow-hidden rounded-[28px] border border-white/[0.09] bg-white/[0.035] backdrop-blur-xl">
          <div className="sticky top-0 z-10 grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-white/[0.08] bg-[#101014]/95 px-4 py-4 text-sm font-semibold text-white backdrop-blur-xl">
            <span>Feature comparison</span>
            {PAID_PLANS.map((plan) => <span key={plan} className="text-center">{PLAN_LABELS[plan]}</span>)}
          </div>
          {FEATURE_ROWS.map((group) => (
            <div key={group.section}>
              <div className="bg-white/[0.035] px-4 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#06B6D4]">
                {group.section}
              </div>
              {group.rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-t border-white/[0.06] px-4 py-3">
                  <span className="text-sm text-zinc-300">{row.label}</span>
                  {PAID_PLANS.map((plan) => <div key={plan} className="text-center"><FeatureValue value={included(plan, row)} /></div>)}
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#06B6D4]" />
            <h2 className="text-sm font-semibold text-white">How GrowthDialer compares</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {COMPETITORS.map((item) => (
              <div key={item.name} className={cn('rounded-2xl border p-4', item.highlight ? 'border-[#8B5CF6]/45 bg-[#8B5CF6]/12' : 'border-white/[0.08] bg-black/20')}>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white">Questions before you start?</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map(([question, answer], index) => (
              <div key={question} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white">
                  {question}
                  <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition', openFaq === index && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
