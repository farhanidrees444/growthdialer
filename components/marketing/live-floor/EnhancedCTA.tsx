'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Phone, Sparkles, Check, MessageCircle } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { SiteFooter } from './SiteFooter';
import { EASE_OUT, reveal, revealContainer } from './motion';

const FAQ_ITEMS = [
  {
    question: 'How does GrowthDialer work?',
    answer: 'GrowthDialer is an AI-powered sales dialer that records, transcribes, and analyzes every call in real-time. Simply import your leads, choose your dialing mode (browse, preview, or power), and start making calls. The AI handles transcription, sentiment analysis, and creates instant call summaries — so you can focus on selling.',
  },
  {
    question: 'What phone numbers can I use?',
    answer: 'You can purchase local numbers from our marketplace in 100+ countries, port your existing numbers, or use your own VoIP provider through our SIP integration. We also offer local presence dialing to automatically display area codes that match your prospects.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Start with a 14-day free trial with full access to all features. No credit card required. You get 100 minutes of calling time to test the platform with your actual leads and workflows.',
  },
  {
    question: 'How accurate is the AI transcription?',
    answer: 'Our AI transcription achieves 95%+ accuracy across most accents and speaking styles. We use industry-leading speech recognition optimized for sales conversations, with continuous improvements from our machine learning models.',
  },
  {
    question: 'Can I integrate with my CRM?',
    answer: 'Absolutely. We offer native integrations with Salesforce, HubSpot, Pipedrive, and other major CRMs. Call recordings, transcripts, summaries, and disposition data sync automatically. You can also use our REST API and webhooks for custom integrations.',
  },
  {
    question: 'What about call recording compliance?',
    answer: 'GrowthDialer includes built-in compliance features for one-party and two-party consent states. You can configure automatic recording disclosures, consent tracking, and region-specific recording rules. We also offer secure storage with encryption at rest.',
  },
  {
    question: 'How does team coaching work?',
    answer: 'Managers can listen to live calls in real-time, whisper guidance that only the rep can hear, or barge into calls when needed. The AI also scores calls and highlights key moments for review, making coaching more efficient and data-driven.',
  },
  {
    question: 'What support do you offer?',
    answer: 'All plans include email support with 24-hour response times. Pro plans get priority chat support. Enterprise customers receive a dedicated account manager, custom onboarding, and SLA guarantees with 99.9% uptime.',
  },
];

function FAQItem({ item, index, isOpen, onToggle }: {
  item: typeof FAQ_ITEMS[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.05 }}
      className="border-b border-white/[0.06] last:border-0"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-white"
      >
        <span className="pr-4 text-[15px] font-medium text-zinc-200">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02]"
        >
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-12 text-[14px] leading-relaxed text-zinc-400">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section ref={containerRef} className="relative px-5 py-20 lg:px-8 lg:py-28">
      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={revealContainer}
          className="mb-12 text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            FAQ
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Questions? <span className="font-medium">Answered.</span>
          </motion.h2>
        </motion.div>

        {/* FAQ list */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] px-6 backdrop-blur-xl">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={item.question}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-sm text-zinc-400">
            Still have questions?
          </p>
          <Link
            href="/contact-sales"
            className="group inline-flex items-center gap-2 text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Talk to our team</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Enhanced Final CTA with animated background
export function FinalCTA() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <>
      <section ref={containerRef} className="relative overflow-hidden px-5 py-24 lg:px-8 lg:py-32">
        {/* Animated gradient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[min(95vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.15] blur-[150px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #06B6D4 40%, transparent 70%)' }}
        />
        
        {/* Grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative mx-auto max-w-4xl text-center"
        >
          {/* Animated waveform */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
            className="mb-10 flex justify-center"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl">
              <LiveWaveform bars={36} height={48} barWidth={3} gap={4} />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]"
          >
            Ready to transform
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text font-medium text-transparent">
                every conversation?
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT }}
              />
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.4 }}
            className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-zinc-400"
          >
            Start your free trial today and see why 500+ sales teams trust GrowthDialer 
            to close more deals.
          </motion.p>

          {/* Features mini-list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.5 }}
            className="mx-auto mt-8 flex flex-wrap justify-center gap-4"
          >
            {['AI transcription', 'Instant summaries', 'CRM sync', 'No credit card'].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span className="text-xs text-zinc-300">{feature}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.6 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-8 text-base font-medium text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact-sales"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-white/[0.08] px-8 text-base font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Talk to Sales
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.8 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['S', 'M', 'J', 'L'].map((initial, i) => (
                  <div
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#08080A] bg-gradient-to-br from-zinc-600 to-zinc-700 text-xs font-bold text-white"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <span className="text-sm text-zinc-400">
                <span className="font-medium text-white">2,500+</span> reps using today
              </span>
            </div>
            <div className="hidden h-4 w-px bg-white/[0.08] sm:block" />
            <span className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
              Rated <span className="font-medium text-white">4.9/5</span> by customers
            </span>
          </motion.div>
        </motion.div>
      </section>

      <SiteFooter />
    </>
  );
}
