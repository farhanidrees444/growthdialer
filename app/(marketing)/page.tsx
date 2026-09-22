import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Hero } from '@/components/marketing/v2/Hero';
import {
  CapabilityMarquee,
  DashboardPanel,
  DeliverabilitySplit,
  DialingPanel,
  Faq,
  FinalCta,
  HowItWorks,
  PersonaCards,
  PositioningStrip,
  PricingTeaser,
  StackBand,
  StatsRow,
  TrustBand,
} from '@/components/marketing/v2/Sections';
import { POSITIONING } from '@/components/marketing/v2/copy';

export const metadata: Metadata = {
  title: 'GrowthDialer — The AI Dialer for Teams That Close on Calls',
  description:
    'Power and parallel dialing, automatic transcripts, and AI-written call briefs. The voice-first sales dialer for outbound teams. Start free — 7-day trial, no credit card.',
  alternates: { canonical: 'https://growthdialer.com' },
};

export default function LandingPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <Hero />
        <CapabilityMarquee />
        <PositioningStrip line={POSITIONING.line} />
        <StackBand />
        <DialingPanel />
        <DashboardPanel />
        <DeliverabilitySplit />
        <PersonaCards />
        <TrustBand />
        <HowItWorks />
        <StatsRow />
        <PricingTeaser />
        <div className="pm-divider">
          <Faq />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
