'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, PhoneCall, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/marketing/live-floor/Reveal';
import { useMarketingMotionReduced, EASE_OUT, revealContainer } from '@/components/marketing/live-floor/motion';

const STEPS = [
  {
    n: '1',
    icon: Upload,
    title: 'Import your leads',
    body: 'CSV upload or manual entry — leads land in a clean queue, ready to dial.',
    accent: '#8B5CF6',
  },
  {
    n: '2',
    icon: PhoneCall,
    title: 'Dial & talk',
    body: 'AI Dialer or Power Dialer. Recording starts the moment you connect.',
    accent: '#06B6D4',
  },
  {
    n: '3',
    icon: Sparkles,
    title: 'AI handles the rest',
    body: 'Transcripts, summaries, sentiment and next steps — logged automatically.',
    accent: '#8B5CF6',
  },
];

export function StickyHowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useMarketingMotionReduced();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const step1 = useTransform(scrollYProgress, [0, 0.33], [1, 0.2]);
  const step2 = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0.2, 1, 0.2]);
  const step3 = useTransform(scrollYProgress, [0.66, 1], [0.2, 1]);
  const opacities = reduce ? [1, 1, 1] : [step1, step2, step3];
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.section
      id="how-it-works"
      ref={ref}
      className="relative overflow-hidden scroll-mt-24"
      style={{ height: reduce ? 'auto' : '280vh' }}
      aria-label="How it works"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18, margin: '-10%' }}
      variants={revealContainer}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-0 h-[420px] w-[420px] rounded-full opacity-[0.05] blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-40 h-[360px] w-[360px] rounded-full opacity-[0.04] blur-3xl"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 72%)' }}
      />
      <div className={reduce ? 'px-5 py-16 lg:px-8 lg:py-24' : 'sticky top-0 flex min-h-screen items-start px-5 py-24 lg:px-8'}>
        <div className="mx-auto w-full max-w-6xl">
          <Reveal className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
              How it works
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
              Live in <span className="font-medium">three steps</span>.
            </h2>
          </Reveal>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative space-y-6">
              {!reduce && (
                <motion.div
                  className="absolute bottom-4 left-5 top-4 w-px origin-top bg-gradient-to-b from-[#8B5CF6] via-[#8B5CF6]/40 to-transparent"
                  style={{ scaleY: lineScale }}
                  aria-hidden
                />
              )}
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const opacity = opacities[i];
                return (
                  <motion.div
                    key={s.n}
                    style={reduce ? undefined : { opacity, scale: opacity }}
                    className="relative pl-12"
                  >
                    <span
                      className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0F0F12] font-display text-lg font-light text-white/20"
                      aria-hidden
                    >
                      {s.n}
                    </span>
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${s.accent}18`, color: s.accent }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-[#F5F5F7]">{s.title}</h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{s.body}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="marketing-glass relative overflow-hidden rounded-[1.75rem] p-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, rgba(139,92,246,0.25), transparent 55%)',
                }}
              />
              <div className="relative space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                    Step in motion
                  </p>
                  <p className="mt-2 font-mono text-sm text-zinc-400">
                    import.csv → 847 leads queued → dial session started
                  </p>
                </div>
                <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.06] p-4">
                  <p className="text-[13px] text-zinc-300">
                    &ldquo;Send pricing for twelve seats — let&apos;s reconnect Thursday.&rdquo;
                  </p>
                  <p className="mt-2 text-[12px] text-[#8B5CF6]">→ Summary ready in 4s</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
