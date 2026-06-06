import type { Metadata } from 'next';
import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { Features } from '@/components/marketing/live-floor/Features';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';
import { IntegrationsMarquee } from '@/components/marketing/home/IntegrationsMarquee';
import { DashboardPreview } from '@/components/marketing/home/DashboardPreview';
import { InteractivePipeline } from '@/components/marketing/home/InteractivePipeline';
import { FeatureSections } from '@/components/marketing/home/FeatureSections';
import { HowItWorks } from '@/components/marketing/home/HowItWorks';
import { StatsStrip } from '@/components/marketing/home/StatsStrip';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { HomeFAQ } from '@/components/marketing/home/HomeFAQ';
import { AiProductPillars } from '@/components/marketing/home/AiProductPillars';

export const metadata: Metadata = {
  title: 'AI Sales Dialer — Record, Transcribe & Analyze Every Call',
  description:
    'GrowthDialer is the AI sales dialer with conversation intelligence, AI call briefs, live coaching, and power dialing. Start free — upgrade your workspace when your team grows.',
  alternates: { canonical: 'https://growthdialer.com' },
};

// "The Live Floor" — the homepage is a living dialer that demonstrates itself
// through real-time motion and an interactive story.
export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen overflow-x-clip bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        {/* Subtle grid depth, faded toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <Nav />
        <main className="relative z-[2]">
          <Hero />
          <IntegrationsMarquee />
          <DashboardPreview />
          <InteractivePipeline />
          <Features />
          <AiProductPillars />
          <FeatureSections />
          <HowItWorks />
          <StatsStrip />
          <EarlyAccess />
          <HomeFAQ />
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
