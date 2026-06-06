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
    body: 'Managers hear the live call without the prospect knowing — useful for QA and shadowing new reps.',
  },
  {
    icon: MessageSquare,
    title: 'Whisper',
    body: 'Coach the rep in real time. Only the rep hears you; the prospect stays on a normal conversation.',
  },
  {
    icon: Headphones,
    title: 'Barge',
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
    body: 'Reps run a power session while a manager monitors connect rate from the floor — whisper on tough objections only.',
  },
  {
    title: 'New rep ramp',
    body: 'Listen to the first ten live calls, leave structured feedback after hang-up, and track dispositions over the week.',
  },
  {
    title: 'Deal rescue',
    body: 'When a rep flags a live call, a lead can barge in with pricing authority without losing recording continuity.',
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
            <span className="font-medium">without leaving the floor.</span>
          </>
        }
        description="Listen, whisper, and barge on active calls from the coaching dashboard. Available on Pro and Team workspaces — built for managers who want visibility, not vanity metrics."
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
        >
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
            return (
              <motion.div
                key={mode.title}
                variants={reveal}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#A78BFA]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-display text-lg font-medium text-[#F5F5F7]">{mode.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{mode.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="border-t border-white/[0.06] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-10 text-center text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            What ships today
          </p>
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
                  className="rounded-2xl border border-white/[0.06] bg-[#0F0F12] p-6"
                >
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[15px] font-medium text-[#F5F5F7]">{f.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{f.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 lg:px-8">
        <h2 className="text-center font-display text-2xl font-light tracking-tight text-[#F5F5F7]">
          Common <span className="font-medium">manager workflows</span>
        </h2>
        <div className="mt-10 space-y-6">
          {WORKFLOWS.map((w) => (
            <article
              key={w.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <h3 className="font-medium text-[#F5F5F7]">{w.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{w.body}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-lg text-center text-[13px] leading-relaxed text-zinc-600">
          We do not publish team performance guarantees or customer counts we cannot verify. Try the
          coaching floor on your own calls and judge whether it fits your process.
        </p>
      </section>

      <EarlyAccess />
    </>
  );
}
