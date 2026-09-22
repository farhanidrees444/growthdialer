'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, MinusCircle } from 'lucide-react';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { APP_SIGNUP } from '@/lib/marketing/navigation';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

export type CompareRow = {
  feature: string;
  growthdialer: boolean | string;
  competitor: boolean | string;
};

export type CompareReason = {
  title: string;
  description: string;
};

export type ComparePageProps = {
  competitor: string;
  badge: string;
  title: React.ReactNode;
  subtitle: string;
  priceGrowthdialer: string;
  priceCompetitor: string;
  rows: CompareRow[];
  reasons: CompareReason[];
};

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" aria-label="Yes" />
    ) : (
      <MinusCircle className="mx-auto h-5 w-5 text-zinc-300" aria-label="No" />
    );
  }
  return <span className="font-semibold text-zinc-950">{value}</span>;
}

export function ComparePage({
  competitor,
  badge,
  title,
  subtitle,
  priceGrowthdialer,
  priceCompetitor,
  rows,
  reasons,
}: ComparePageProps) {
  return (
    <>
      <MarketingPageHero eyebrow={badge} title={title} description={subtitle}>
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/pricing" className="mk-btn mk-btn-secondary">
          See pricing
        </Link>
      </MarketingPageHero>

      <section className="px-5 pb-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto grid max-w-2xl grid-cols-2 gap-4"
        >
          <div className="mk-card border-[#7C3AED]/25 p-6 text-center">
            <div className="font-display text-4xl font-semibold text-[#6D28D9]">{priceGrowthdialer}</div>
            <div className="mt-1 text-sm text-zinc-500">GrowthDialer</div>
          </div>
          <div className="mk-card p-6 text-center">
            <div className="font-display text-4xl font-semibold text-zinc-400">{priceCompetitor}</div>
            <div className="mt-1 text-sm text-zinc-500">{competitor}</div>
          </div>
        </motion.div>
      </section>

      <section className="px-5 py-12 lg:px-8">
        <Reveal className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-zinc-950/[0.08] bg-white shadow-[0_2px_16px_rgba(9,9,11,0.06)]">
          <div className="grid grid-cols-3 border-b border-zinc-950/[0.08] bg-zinc-50 px-4 py-3 text-center text-sm font-semibold">
            <span className="text-left text-zinc-500">Feature</span>
            <span className="text-[#6D28D9]">GrowthDialer</span>
            <span className="text-zinc-500">{competitor}</span>
          </div>
          {rows.map((row, i) => (
            <Reveal key={row.feature} delay={i * 40} variant="up">
              <div
                className={cn(
                  'grid grid-cols-3 items-center px-4 py-3.5 text-sm',
                  i % 2 === 1 && 'bg-zinc-50/60'
                )}
              >
                <span className="text-zinc-600">{row.feature}</span>
                <div className="text-center">
                  <CellValue value={row.growthdialer} />
                </div>
                <div className="text-center">
                  <CellValue value={row.competitor} />
                </div>
              </div>
            </Reveal>
          ))}
        </Reveal>
      </section>

      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={(i % 2) * 70}>
              <article className="mk-card mk-card-hover h-full p-6">
                <h2 className="font-display text-lg font-semibold text-zinc-950">{r.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{r.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <p className="mx-auto max-w-2xl text-center text-[12px] leading-relaxed text-zinc-500">
          Competitor prices shown are approximate public list rates — confirm with each vendor.
          GrowthDialer Pro is {priceGrowthdialer}/workspace/mo; Starter is free.{' '}
          <a href="/pricing" className="font-medium text-[#6D28D9] hover:underline">
            Full pricing →
          </a>
        </p>
      </section>
    </>
  );
}
