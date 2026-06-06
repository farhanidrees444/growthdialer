'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap, Database, Globe, Settings } from 'lucide-react';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRM',
  communication: 'Communication',
  automation: 'Automation',
  calendar: 'Calendar',
  productivity: 'Productivity',
};

const benefits = [
  {
    icon: Zap,
    title: 'Zero manual logging',
    description: 'Disposition, duration, and recording link push to your CRM when the rep hangs up.',
  },
  {
    icon: Database,
    title: 'One call record',
    description: 'Call Logs, Recordings, and AI summaries stay in sync — inbound and outbound.',
  },
  {
    icon: Globe,
    title: 'Your stack, not ours',
    description: 'We integrate where your team already works. No forced migration.',
  },
  {
    icon: Settings,
    title: 'Outcome triggers',
    description: 'Fire automations on meeting booked, callback, or negative sentiment.',
  },
];

const categories = ['crm', 'communication', 'automation', 'calendar', 'productivity'] as const;

export default function IntegrationsContent() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#08080A] text-[#F5F5F7] antialiased">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
      />
      <Nav />
      <div className="relative z-[2] pt-24 pb-20 px-5 lg:px-8">
        <motion.section
          initial="hidden"
          animate="show"
          variants={revealContainer}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            Integrations
          </motion.p>
          <motion.h1 variants={reveal} className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-light leading-[1.05] tracking-tight">
            Connect the stack you already run on.
          </motion.h1>
          <motion.p variants={reveal} className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-zinc-400">
            HubSpot logs calls today. Salesforce, Slack, Zapier, and the rest are on the roadmap — join the waitlist from your workspace.
          </motion.p>
          <motion.div variants={reveal} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/integrations"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
            >
              Open integration hub
            </Link>
          </motion.div>
        </motion.section>

        <section className="mx-auto mt-20 max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
            >
              <b.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">{b.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{b.description}</p>
            </motion.div>
          ))}
        </section>

        {categories.map((cat) => {
          const items = INTEGRATION_BRANDS.filter((b) => b.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mx-auto mt-16 max-w-5xl">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => {
                  const Icon = item.Icon;
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3 }}
                      className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.14]"
                    >
                      {item.live && (
                        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                          Live
                        </span>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
                          style={{ color: item.color }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <h3 className="font-semibold text-white">{item.name}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-500">{item.description}</p>
                      {!item.live && (
                        <p className={cn('mt-3 text-[11px] font-medium text-zinc-600')}>Waitlist — notify from app</p>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="mx-auto mt-20 max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center backdrop-blur-xl">
          <h2 className="font-display text-2xl font-light text-white mb-3">REST API & webhooks</h2>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            Engineering team? Pipe call events to your data warehouse or internal tools. Same pipeline that powers Call Logs and AI analysis.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Get API access with your workspace <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-zinc-600">
            {['HubSpot live now', 'No credit card to start', 'Call Logs for every dial'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
