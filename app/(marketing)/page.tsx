import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { BentoFeatures } from '@/components/marketing/live-floor/BentoFeatures';
import { CallJourney } from '@/components/marketing/live-floor/CallJourney';
import { Features } from '@/components/marketing/live-floor/Features';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';
import { IntegrationsMarquee } from '@/components/marketing/home/IntegrationsMarquee';
import { InteractivePipeline } from '@/components/marketing/home/InteractivePipeline';
import { StatsStrip } from '@/components/marketing/home/StatsStrip';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { HomeFAQ } from '@/components/marketing/home/HomeFAQ';

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
          <BentoFeatures />
          <CallJourney />
          <InteractivePipeline />
          <Features />
          <StatsStrip />
          <EarlyAccess />
          <HomeFAQ />
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
