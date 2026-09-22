import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareVsTemplate } from '@/components/marketing/v2/CompareVs';
import { getCompetitorBySlug } from '@/lib/marketing/pseo-competitors';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

const SLUG = 'nooks';

export const metadata: Metadata = {
  title: 'GrowthDialer vs Nooks — AI Dialer Comparison',
  description:
    'Compare GrowthDialer vs Nooks: power dialing, AI call intelligence, live coaching floor, and per-seat pricing. 7-day free trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-nooks` },
  openGraph: {
    title: 'GrowthDialer vs Nooks',
    description: 'Outbound AI dialer comparison for B2B sales teams.',
    url: `${MARKETING_SITE}/compare/vs-nooks`,
  },
};

export default function VsNooksPage() {
  const competitor = getCompetitorBySlug(SLUG);
  if (!competitor) notFound();
  return <CompareVsTemplate competitor={competitor} basePath="compare" />;
}
