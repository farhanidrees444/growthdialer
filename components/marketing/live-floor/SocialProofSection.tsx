'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, Building2, Users, Zap, TrendingUp } from 'lucide-react';
import { EASE_OUT, reveal, revealContainer } from './motion';

// Company logos with colorful gradients
const COMPANIES = [
  { name: 'Acme Corp', gradient: 'from-violet-500 to-purple-600' },
  { name: 'TechStart', gradient: 'from-cyan-500 to-blue-600' },
  { name: 'Globex', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Initech', gradient: 'from-orange-500 to-red-600' },
  { name: 'Umbrella', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Stark Ind', gradient: 'from-amber-500 to-yellow-600' },
  { name: 'Wayne Tech', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Oscorp', gradient: 'from-green-500 to-emerald-600' },
];

const TESTIMONIALS = [
  {
    quote: "GrowthDialer transformed our outbound. We went from 15% connect rate to over 45% in just 2 months. The AI insights alone paid for the platform 10x over.",
    author: "Sarah Chen",
    role: "VP Sales",
    company: "TechStart Inc",
    avatar: 'SC',
    gradient: 'from-[#8B5CF6] to-[#06B6D4]',
    stats: { metric: '+200%', label: 'Connect Rate' },
  },
  {
    quote: "The power dialer is a game-changer. My team makes 3x more calls and the AI transcription means we never miss a detail. Best investment we made this year.",
    author: "Michael Torres",
    role: "Sales Director",
    company: "Acme Corp",
    avatar: 'MT',
    gradient: 'from-[#06B6D4] to-[#10B981]',
    stats: { metric: '3x', label: 'More Calls' },
  },
  {
    quote: "Finally, a dialer that actually understands sales. The real-time coaching features helped us onboard new reps in half the time. Pure magic.",
    author: "Jessica Park",
    role: "Head of Revenue",
    company: "Globex Industries",
    avatar: 'JP',
    gradient: 'from-[#F59E0B] to-[#EF4444]',
    stats: { metric: '50%', label: 'Faster Onboarding' },
  },
];

const STATS_HIGHLIGHT = [
  { icon: Building2, value: '500+', label: 'Companies', color: 'text-[#8B5CF6]' },
  { icon: Users, value: '10,000+', label: 'Sales Reps', color: 'text-[#06B6D4]' },
  { icon: Zap, value: '50M+', label: 'Calls Made', color: 'text-[#F59E0B]' },
  { icon: TrendingUp, value: '2.5x', label: 'More Connects', color: 'text-[#10B981]' },
];

function LogoTicker() {
  return (
    <div className="relative overflow-hidden py-8">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#08080A] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#08080A] to-transparent" />
      
      {/* Ticker track */}
      <div className="flex w-max gap-12 ticker-track">
        {/* Duplicate for seamless loop */}
        {[...COMPANIES, ...COMPANIES].map((company, i) => (
          <div
            key={`${company.name}-${i}`}
            className="group flex items-center gap-3 whitespace-nowrap"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${company.gradient} shadow-lg`}>
              <span className="text-sm font-bold text-white">
                {company.name.split(' ').map(w => w[0]).join('')}
              </span>
            </div>
            <span className="text-base font-medium text-zinc-500 transition-colors group-hover:text-zinc-300">
              {company.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.15 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
    >
      {/* Gradient accent on hover */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${testimonial.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      
      {/* Quote icon */}
      <Quote className="mb-4 h-8 w-8 text-white/[0.06]" />
      
      {/* Quote */}
      <p className="mb-6 text-[15px] leading-relaxed text-zinc-300">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      
      {/* Stats badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
        <span className={`text-lg font-bold bg-gradient-to-r ${testimonial.gradient} bg-clip-text text-transparent`}>
          {testimonial.stats.metric}
        </span>
        <span className="text-xs text-zinc-500">{testimonial.stats.label}</span>
      </div>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-sm font-bold text-white`}>
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{testimonial.author}</p>
          <p className="text-xs text-zinc-500">{testimonial.role}, {testimonial.company}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function SocialProofSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section ref={containerRef} className="relative px-5 py-16 lg:px-8 lg:py-24">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[min(90vw,800px)] -translate-x-1/2 rounded-full opacity-[0.05] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #06B6D4 50%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={revealContainer}
          className="mb-8 text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            Trusted by top sales teams
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
            Join <span className="font-medium">500+ companies</span> closing more deals
          </motion.h2>
        </motion.div>

        {/* Logo ticker */}
        <LogoTicker />

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
          className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS_HIGHLIGHT.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-xl"
            >
              <stat.icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} />
              <p className="font-display text-2xl font-light text-white lg:text-3xl">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600"
          >
            What our customers say
          </motion.p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-sm text-zinc-400">
            Rated <span className="font-medium text-white">4.9/5</span> from 200+ reviews
          </p>
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
