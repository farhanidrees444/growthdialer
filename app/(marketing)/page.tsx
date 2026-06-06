import type { Metadata } from 'next';
import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { BackgroundSystem } from '@/components/marketing/live-floor/BackgroundSystem';
import { ScrollProgress } from '@/components/marketing/live-floor/ScrollProgress';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { Features } from '@/components/marketing/live-floor/Features';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';
import { IntegrationsMarquee } from '@/components/marketing/home/IntegrationsMarquee';
import { ProductPreviewTabs } from '@/components/marketing/home/ProductPreviewTabs';
import { StickyHowItWorks } from '@/components/marketing/home/StickyHowItWorks';
import { StatsStrip } from '@/components/marketing/home/StatsStrip';
import { TestimonialsTicker } from '@/components/marketing/home/TestimonialsTicker';
import { HomePricing } from '@/components/marketing/home/HomePricing';
import { HomeFAQ } from '@/components/marketing/home/HomeFAQ';

export const metadata: Metadata = {
  title: 'AI Sales Dialer — Record, Transcribe & Analyze Every Call',
  description:
    'GrowthDialer is the AI sales dialer with conversation intelligence, AI call briefs, live coaching, and power dialing. Start free — upgrade your workspace when your team grows.',
  alternates: { canonical: 'https://growthdialer.com' },
};

export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen bg-[#08080A] text-[#F8F8FF] antialiased selection:bg-[#7C3AED]/30 selection:text-white">
        <BackgroundSystem />
        <Grain />
        <ScrollProgress />
        <Nav />
        <main className="relative z-[2]">
          <Hero />
          <IntegrationsMarquee />
          <ProductPreviewTabs />
          <Features />
          <StickyHowItWorks />
          <StatsStrip />
          <TestimonialsTicker />
          <HomePricing />
          <HomeFAQ />
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
