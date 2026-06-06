'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { APP_SIGNUP } from '@/lib/marketing/navigation';
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
  testimonial?: { quote: string; author: string; role: string };
};

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" />
    ) : (
      <XCircle className="mx-auto h-5 w-5 text-zinc-600" />
    );
  }
  return <span className="font-semibold text-[#F5F5F7]">{value}</span>;
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
  testimonial,
}: ComparePageProps) {
  return (
    <>
      <MarketingPageHero eyebrow={badge} title={title} description={subtitle}>
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
          <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-6 text-center">
            <div className="text-4xl font-bold text-[#A78BFA]">{priceGrowthdialer}</div>
            <div className="mt-1 text-sm text-zinc-400">GrowthDialer</div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <div className="text-4xl font-bold text-zinc-500">{priceCompetitor}</div>
            <div className="mt-1 text-sm text-zinc-500">{competitor}</div>
          </div>
        </motion.div>
      </section>

      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
          <div className="grid grid-cols-3 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold">
            <span className="text-left text-zinc-500">Feature</span>
            <span className="text-[#A78BFA]">GrowthDialer</span>
            <span className="text-zinc-500">{competitor}</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={cn(
                'grid grid-cols-3 items-center px-4 py-3.5 text-sm',
                i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
              )}
            >
              <span className="text-zinc-400">{row.feature}</span>
              <div className="text-center">
                <CellValue value={row.growthdialer} />
              </div>
              <div className="text-center">
                <CellValue value={row.competitor} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {reasons.map((r) => (
            <article
              key={r.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <h2 className="font-display text-lg font-medium text-[#F5F5F7]">{r.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{r.description}</p>
            </article>
          ))}
        </div>
      </section>

      {testimonial && (
        <section className="px-5 pb-20 lg:px-8">
          <blockquote className="mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center backdrop-blur-xl">
            <p className="text-[17px] leading-relaxed text-zinc-300">&ldquo;{testimonial.quote}&rdquo;</p>
            <footer className="mt-4 text-sm text-zinc-500">
              {testimonial.author} — {testimonial.role}
            </footer>
          </blockquote>
        </section>
      )}
    </>
  );
}
