import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { CallLifecycle } from '@/components/marketing/live-floor/CallLifecycle';
import { EcosystemFlow } from '@/components/marketing/live-floor/EcosystemFlow';
import { Features } from '@/components/marketing/live-floor/Features';
import { ConversationIntelligence } from '@/components/marketing/live-floor/ConversationIntelligence';
import { FinalCTA } from '@/components/marketing/live-floor/FinalCTA';

// "The Live Floor" — the homepage is a living dialer that demonstrates itself
// through real-time motion and a scroll-driven story.
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08080A] text-[#F5F5F7] antialiased">
      <Grain />
      <Nav />
      <main className="relative z-[2]">
        <Hero />
        <CallLifecycle />
        <EcosystemFlow />
        <Features />
        <ConversationIntelligence />
        <FinalCTA />
      </main>
    </div>
  );
}
