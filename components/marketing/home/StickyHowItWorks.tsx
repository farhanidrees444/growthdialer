'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, PhoneCall, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/marketing/live-floor/Reveal';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';

const STEPS = [
  {
    n: '1',
    icon: Upload,
    title: 'Import your leads',
    body: 'CSV upload or manual entry — leads land in a clean queue, ready to dial.',
    accent: '#7C3AED',
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
    accent: '#A78BFA',
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
    <section
      id="how-it-works"
      ref={ref}
      className="relative scroll-mt-24"
      style={{ height: reduce ? 'auto' : '280vh' }}
      aria-label="How it works"
    >
      <div className={reduce ? 'px-5 py-16 lg:px-8 lg:py-24' : 'sticky top-0 flex min-h-screen items-center px-5 py-24 lg:px-8'}>
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
                  className="absolute bottom-4 left-5 top-4 w-px origin-top bg-gradient-to-b from-[#7C3AED] via-[#7C3AED]/40 to-transparent"
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
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F0F12] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, rgba(124,58,237,0.25), transparent 55%)',
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
                <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.06] p-4">
                  <p className="text-[13px] text-zinc-300">
                    &ldquo;Send pricing for twelve seats — let&apos;s reconnect Thursday.&rdquo;
                  </p>
                  <p className="mt-2 text-[12px] text-[#A78BFA]">→ Summary ready in 4s</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
