import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareVsTemplate } from '@/components/marketing/v2/CompareVs';
import { getCompetitorBySlug } from '@/lib/marketing/pseo-competitors';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

const SLUG = 'readymode';

export const metadata: Metadata = {
  title: { absolute: 'GrowthDialer vs ReadyMode — AI Dialer Comparison' },
  description:
    'Compare GrowthDialer vs ReadyMode: power dialing, AI call intelligence, live coaching floor, and per-seat pricing. 7-day free trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-readymode` },
  openGraph: {
    title: 'GrowthDialer vs ReadyMode',
    description: 'Outbound AI dialer comparison for B2B sales teams.',
    url: `${MARKETING_SITE}/compare/vs-readymode`,
  },
};

export default function VsReadyModePage() {
  const competitor = getCompetitorBySlug(SLUG);
  if (!competitor) notFound();
  return <CompareVsTemplate competitor={competitor} basePath="compare" />;
}
