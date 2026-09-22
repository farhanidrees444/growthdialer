import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareVsTemplate } from '@/components/marketing/v2/CompareVs';
import { getCompetitorBySlug } from '@/lib/marketing/pseo-competitors';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

const SLUG = 'powerdialer';

export const metadata: Metadata = {
  title: { absolute: 'GrowthDialer vs PowerDialer — AI Dialer Comparison' },
  description:
    'Compare GrowthDialer vs PowerDialer: power dialing, AI call intelligence, live coaching floor, and per-seat pricing. 7-day free trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-powerdialer` },
  openGraph: {
    title: 'GrowthDialer vs PowerDialer',
    description: 'Outbound AI dialer comparison for B2B sales teams.',
    url: `${MARKETING_SITE}/compare/vs-powerdialer`,
  },
};

export default function VsPowerDialerPage() {
  const competitor = getCompetitorBySlug(SLUG);
  if (!competitor) notFound();
  return (
    <CompareVsTemplate
      competitor={competitor}
      basePath="compare"
      verdict={{
        pickThem:
          'PowerDialer has served insurance and B2C outbound teams for years. If your team is settled on its workflows and your numbers are healthy, churning for churn\u2019s sake is a bad trade.',
        pickUs:
          'Pick GrowthDialer if you want the same power-dial motion with AI summaries, pre-call briefs, and a live coaching floor included — 7-day free trial, no credit card, monthly billing.',
      }}
    />
  );
}
