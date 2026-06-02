'use client';

import { motion } from 'framer-motion';
import { Target, Zap, Brain, Users, BarChart3, ShieldCheck, Clock } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { reveal, revealContainer } from './motion';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Conversation Intelligence',
    body: 'Whisper transcribes, Gemini analyzes. Summaries, sentiment and intent on every recorded call — automatically.',
  },
  {
    icon: Zap,
    title: 'Power Dialer',
    body: 'Burn through a call list back-to-back. Disposition, take notes and move to the next number without breaking rhythm.',
  },
  {
    icon: Users,
    title: 'Smart Leads',
    body: 'Import, organize and work your pipeline. Every call links back to the lead with full history.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'Connect rate, talk time, dispositions, sentiment trends — your whole calling operation in one view.',
  },
  {
    icon: ShieldCheck,
    title: 'Number Health & Spam Monitoring',
    body: 'Track carrier reputation and spam risk on every number so your calls keep landing.',
  },
];

const COMING_SOON = ['Parallel dialing', 'Real-time coaching'AI voice agent'];

export function Features() {
  return (
    <section id="features" className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={revealContainer}
          className="mb-14 max-w-2xl"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
            What you get today
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-foreground">
            A dialer that does the <span className="font-medium">listening</span> for you.
          </motion.h2>
        </motion.div>

        {/* Bento grid — asymmetric, no uniform box-in-box */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealContainer}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Hero feature — AI Dialer, spans 2 cols on lg, with living waveform */}
          <motion.article
            variants={reveal}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] sm:col-span-2 lg:row-span-2"
          >
            <Spotlight />
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-[hsl(258,90%,66%)']">
                  <Target className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  3-mode Focus Stage
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">
                AI Dialer
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                A focused calling surface built for outbound. Move through leads
                with a clean three-mode stage, live call controls and instant
                recording — designed so the rep only has to talk.
              </p>
            </div>

            {/* Living waveform anchored in the card */}
            <div className="mt-8 rounded-xl border border-white/[0.05] bg-black/30 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> On call
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground/60">01:08</span>
              </div>
              <LiveWaveform bars={52} height={48} barWidth={2.5} gap={2.5} />
            </div>
          </motion.article>

          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                variants={reveal}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
              >
                <Spotlight />
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground/90 transition-colors group-hover:text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-[15px] font-medium text-foreground">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Honest coming-soon strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.01] px-6 py-4 sm:flex-row sm:items-center"
        >
          <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
            <Clock className="h-3.5 w-3.5" /> On the roadmap
          </span>
          <div className="flex flex-wrap gap-2">
            {COMING_SOON.map((c) => (
              <span key={c} className="rounded-full border border-white/[0.08] px-3 py-1 text-[12px] text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
