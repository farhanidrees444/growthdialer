'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, MessageSquare, Users, BarChart2, Headphones, Radio } from 'lucide-react';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { APP_SIGNUP } from '@/lib/marketing/navigation';

const COACHING_MODES = [
  {
    icon: Eye,
    title: 'Listen',
    status: 'Live today',
    body: 'Managers hear the live call without the prospect knowing — useful for QA and shadowing new reps.',
  },
  {
    icon: MessageSquare,
    title: 'Whisper',
    status: 'Roadmap',
    body: 'Coach the rep in real time — only the rep hears you. Landing soon after listen mode.',
  },
  {
    icon: Headphones,
    title: 'Barge',
    status: 'Roadmap',
    body: 'Join the call when a deal needs a leader in the room — escalation without switching tools.',
  },
];

const FEATURES = [
  {
    icon: Radio,
    title: 'Live coaching floor',
    body: 'See who is on a call, how long they have been connected, and jump in from one dashboard view.',
  },
  {
    icon: Users,
    title: 'Team visibility',
    body: 'Workspace-scoped seats and roles so managers see their pod — not every account in the org.',
  },
  {
    icon: BarChart2,
    title: 'Call outcomes in analytics',
    body: 'Dispositions and duration roll into Analytics so you review patterns instead of sitting on every dial.',
  },
];

const WORKFLOWS = [
  {
    title: 'Morning power block',
    body: 'Reps run a power session while a manager monitors connect rate from the floor — structured feedback after hang-up.',
  },
  {
    title: 'New rep ramp',
    body: 'Listen to the first ten live calls, leave structured feedback after hang-up, and track dispositions over the week.',
  },
  {
    title: 'Deal rescue',
    body: 'When a rep flags a live call, a lead can take over the call context with full recording continuity.',
  },
];

export default function SalesfloorContent() {
  return (
    <>
      <MarketingPageHero
        eyebrow="Salesfloor"
        title={
          <>
            Coach live calls
            <br />
            <span className="font-semibold">without leaving the floor.</span>
          </>
        }
        description="Listen in on active calls from the coaching dashboard — with whisper and barge on the roadmap. Available on Pro and Team workspaces — built for managers who want visibility, not vanity metrics."
      >
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/pricing" className="mk-btn mk-btn-secondary">
          View plans
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-16 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealContainer}
          className="grid gap-4 md:grid-cols-3"
        >
          {COACHING_MODES.map((mode) => {
            const Icon = mode.icon;
            const live = mode.status === 'Live today';
            return (
              <motion.div
                key={mode.title}
                variants={reveal}
                className="mk-card mk-card-hover p-6"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#6D28D9]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-zinc-950">{mode.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      live
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {mode.status}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{mode.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="border-t border-zinc-950/[0.06] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mk-eyebrow justify-center mb-10">What ships today</p>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={revealContainer}
            className="grid gap-4 md:grid-cols-3"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={reveal}
                  className="mk-card mk-card-hover p-6"
                >
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950/[0.05] text-zinc-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{f.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{f.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 lg:px-8">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-zinc-950">
          Common <span className="font-semibold">manager workflows</span>
        </h2>
        <div className="mt-10 space-y-4">
          {WORKFLOWS.map((w) => (
            <article key={w.title} className="mk-card p-6">
              <h3 className="font-semibold text-zinc-950">{w.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{w.body}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-lg text-center text-[13px] leading-relaxed text-zinc-500">
          We do not publish team performance guarantees or customer counts we cannot verify. Try the
          coaching floor on your own calls and judge whether it fits your process.
        </p>
      </section>

      <EarlyAccess />
    </>
  );
}
