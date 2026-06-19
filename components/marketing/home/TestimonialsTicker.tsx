'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { reveal, revealContainer, SPRING } from '@/components/marketing/live-floor/motion';

const ROW1 = [
  {
    quote: 'We stopped scribbling notes mid-call. Summaries land before I hang up.',
    name: 'Maya R.',
    title: 'SDR Lead',
    company: 'B2B SaaS',
    featured: true,
  },
  {
    quote: 'Power dialer + AI briefs cut our prep time in half. The floor feels calmer.',
    name: 'Chris T.',
    title: 'Rev Ops',
    company: 'Agency',
  },
  {
    quote: 'Coaching mode let our manager whisper without jumping on every live call.',
    name: 'Priya K.',
    title: 'Sales Manager',
    company: 'Fintech',
  },
  {
    quote: 'Honest product — recording and summaries work on day one, no enterprise sales call.',
    name: 'Leo M.',
    title: 'Founder',
    company: 'Startup',
  },
];

const ROW2 = [
  {
    quote: 'Number health alerts saved us from a spam flag on our main line.',
    name: 'Jordan H.',
    title: 'AE',
    company: 'Logistics',
  },
  {
    quote: 'The AI dialer focus stages match how we actually run outbound blocks.',
    name: 'Sam W.',
    title: 'SDR',
    company: 'HR Tech',
    featured: true,
  },
  {
    quote: 'Analytics finally show connect rate and talk time in one place.',
    name: 'Alex P.',
    title: 'Head of Sales',
    company: 'Martech',
  },
  {
    quote: 'Setup took minutes. First summarized call convinced the team.',
    name: 'Riley N.',
    title: 'SDR Manager',
    company: 'Cyber',
  },
];

function Card({
  quote,
  name,
  title,
  company,
  featured,
}: (typeof ROW1)[number]) {
  const ref = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smoothX = useSpring(mx, { stiffness: 200, damping: 25, mass: 0.35 });
  const smoothY = useSpring(my, { stiffness: 200, damping: 25, mass: 0.35 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    setHovered(false);
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.article
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ y: -2 }}
      transition={SPRING}
      style={{ rotateX, rotateY, willChange: hovered ? 'transform' : 'auto' }}
      className={
        featured
          ? 'relative w-[320px] shrink-0 self-start rounded-2xl border border-l-2 border-l-[#8B5CF6] border-white/[0.08] bg-[#12121A] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] [transform-style:preserve-3d]'
          : 'relative w-[320px] shrink-0 self-start rounded-2xl border border-white/[0.08] bg-[#0F0F12] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] [transform-style:preserve-3d]'
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="mb-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Early feedback
      </span>
      <p className="text-[15px] italic leading-relaxed text-zinc-200">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full bg-[conic-gradient(from_120deg,#8B5CF6,#06B6D4,#8B5CF6)] p-px">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0E] text-sm font-semibold text-white">
            {name.charAt(0)}
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold text-[#F5F5F7]">{name}</p>
          <p className="text-[12px] text-zinc-500">
            {title} · {company}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function TickerRow({
  items,
  reverse,
}: {
  items: typeof ROW1;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={`flex w-max items-start gap-4 [perspective:800px] ${reverse ? 'marquee-track-reverse' : 'marquee-track'}`}>
        {doubled.map((t, i) => (
          <Card key={`${t.name}-${i}`} {...t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsTicker() {
  return (
    <motion.section
      className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3, margin: '-10%' }}
      variants={revealContainer}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-16 h-80 w-80 rounded-full opacity-[0.045] blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-[8%] h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <motion.div variants={reveal} className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Early teams
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-tight text-[#F5F5F7]">
          Built with <span className="font-medium">outbound teams</span> in mind.
        </h2>
        <p className="mt-4 text-[15px] text-zinc-500">
          Trusted by early SDR teams — feedback from our first customers.
        </p>
      </motion.div>
      <motion.div variants={reveal} className="space-y-4">
        <TickerRow items={ROW1} />
        <TickerRow items={ROW2} reverse />
      </motion.div>
    </motion.section>
  );
}
