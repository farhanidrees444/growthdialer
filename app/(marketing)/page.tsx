import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
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
    'GrowthDialer is the AI sales dialer with power + parallel dialing, AI call briefs, built-in conversation intelligence, and a manager coaching floor. Start free — upgrade when your team grows.',
  alternates: { canonical: 'https://growthdialer.com' },
};

function AmbientSection({
  children,
  tone = 'purple',
  align = 'left',
}: {
  children: ReactNode;
  tone?: 'purple' | 'cyan' | 'mixed';
  align?: 'left' | 'right' | 'center';
}) {
  const background =
    tone === 'cyan'
      ? 'radial-gradient(circle, #06B6D4 0%, transparent 70%)'
      : tone === 'mixed'
        ? 'radial-gradient(circle at 42% 48%, #8B5CF6 0%, #06B6D4 44%, transparent 72%)'
        : 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)';
  const position =
    align === 'right'
      ? 'right-[4%]'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-[4%]';

  return (
    <div className="marketing-section relative overflow-hidden">
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 h-[420px] w-[min(84vw,680px)] rounded-full opacity-[0.045] blur-3xl ${position}`}
        style={{ background }}
      />
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen bg-[#08080A] text-[#F8F8FF] antialiased selection:bg-[#8B5CF6]/30 selection:text-white">
        <BackgroundSystem />
        <ScrollProgress />
        <Nav />
        <main className="relative z-[2]">
          <Hero />
          <AmbientSection tone="purple" align="left">
            <IntegrationsMarquee />
          </AmbientSection>
          <AmbientSection tone="cyan" align="right">
            <ProductPreviewTabs />
          </AmbientSection>
          <AmbientSection tone="mixed" align="center">
            <Features />
          </AmbientSection>
          <AmbientSection tone="purple" align="left">
            <StickyHowItWorks />
          </AmbientSection>
          <AmbientSection tone="cyan" align="right">
            <StatsStrip />
          </AmbientSection>
          <AmbientSection tone="mixed" align="center">
            <TestimonialsTicker />
          </AmbientSection>
          <AmbientSection tone="purple" align="right">
            <HomePricing />
          </AmbientSection>
          <AmbientSection tone="cyan" align="left">
            <HomeFAQ />
          </AmbientSection>
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
