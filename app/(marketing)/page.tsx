import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { CallLifecycle } from '@/components/marketing/live-floor/CallLifecycle';
import { EcosystemFlow } from '@/components/marketing/live-floor/EcosystemFlow';
import { Features } from '@/components/marketing/live-floor/Features';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';
import { SocialProof } from '@/components/marketing/home/SocialProof';
import { DashboardPreview } from '@/components/marketing/home/DashboardPreview';
import { FeatureSections } from '@/components/marketing/home/FeatureSections';
import { IntegrationsShowcase } from '@/components/marketing/home/IntegrationsShowcase';
import { StatsStrip } from '@/components/marketing/home/StatsStrip';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { HomeFAQ } from '@/components/marketing/home/HomeFAQ';

// "The Live Floor" — the homepage is a living dialer that demonstrates itself
// through real-time motion and a scroll-driven story.
export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen overflow-x-hidden bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2]">
          <Hero />
          <SocialProof />
          <DashboardPreview />
          <CallLifecycle />
          <EcosystemFlow />
          <Features />
          <FeatureSections />
          <IntegrationsShowcase />
          <StatsStrip />
          <EarlyAccess />
          <HomeFAQ />
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
