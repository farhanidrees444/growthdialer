import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareVsTemplate } from '@/components/marketing/v2/CompareVs';
import { getCompetitorBySlug } from '@/lib/marketing/pseo-competitors';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

const SLUG = 'gohighlevel';

export const metadata: Metadata = {
  title: 'GrowthDialer vs GoHighLevel — AI Dialer Comparison',
  description:
    'Compare GrowthDialer vs GoHighLevel: a voice-first AI dialer with power and parallel dialing, AI call briefs, and live transcription — versus an all-in-one marketing platform. Per-seat pricing from $49/seat/mo. 7-day free trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-gohighlevel` },
  openGraph: {
    title: 'GrowthDialer vs GoHighLevel',
    description: 'Voice-first AI dialer vs all-in-one marketing platform — compare calling depth, AI intelligence, and pricing.',
    url: `${MARKETING_SITE}/compare/vs-gohighlevel`,
  },
};

export default function VsGoHighLevelPage() {
  const competitor = getCompetitorBySlug(SLUG);
  if (!competitor) notFound();
  return <CompareVsTemplate competitor={competitor} basePath="compare" />;
}
