import type { Metadata } from 'next';
import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { ScrollProgress } from '@/components/marketing/live-floor/ScrollProgress';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { Features } from '@/components/marketing/live-floor/Features';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';
import { IntegrationsMarquee } from '@/components/marketing/home/IntegrationsMarquee';
import { ProductPreviewTabs } from '@/components/marketing/home/ProductPreviewTabs';
import { StickyHowItWorks } from '@/components/marketing/home/StickyHowItWorks';
import { StatsStrip } from '@/components/marketing/home/StatsStrip';
import { ValueProps } from '@/components/marketing/home/ValueProps';
import { HomePricing } from '@/components/marketing/home/HomePricing';
import { HomeFAQ } from '@/components/marketing/home/HomeFAQ';

export const metadata: Metadata = {
  title: 'AI Sales Dialer — Record, Transcribe & Analyze Every Call',
  description:
    'GrowthDialer is the AI sales dialer with power + parallel dialing, AI call briefs, built-in conversation intelligence, and a manager coaching floor. Start free — upgrade when your team grows.',
  alternates: { canonical: 'https://growthdialer.com' },
};

export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen overflow-x-clip bg-white text-zinc-950 antialiased selection:bg-[#7C3AED]/15">
        <ScrollProgress />
        <Nav />
        <main className="relative z-[2]">
          <Hero />
          <div className="marketing-section">
            <IntegrationsMarquee />
          </div>
          <div className="marketing-section">
            <ProductPreviewTabs />
          </div>
          <div className="marketing-section">
            <Features />
          </div>
          <div className="marketing-section">
            <StickyHowItWorks />
          </div>
          <div className="marketing-section">
            <StatsStrip />
          </div>
          <div className="marketing-section">
            <ValueProps />
          </div>
          <div className="marketing-section">
            <HomePricing />
          </div>
          <div className="marketing-section">
            <HomeFAQ />
          </div>
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
