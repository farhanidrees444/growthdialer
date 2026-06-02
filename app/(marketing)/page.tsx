import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { Hero } from '@/components/marketing/live-floor/Hero';
import { TabbedFeatures } from '@/components/marketing/live-floor/TabbedFeatures';
import { SocialProofSection } from '@/components/marketing/live-floor/SocialProofSection';
import { EnterpriseCTA } from '@/components/marketing/live-floor/EnterpriseCTA';
import { IntegrationsSection } from '@/components/marketing/live-floor/IntegrationsSection';
import { FAQSection, FinalCTA } from '@/components/marketing/live-floor/EnhancedCTA';
import { DashboardPreview } from '@/components/marketing/home/DashboardPreview';

// "The Live Floor" — the homepage is a living dialer that demonstrates itself
// through real-time motion and a scroll-driven story.
export default function LandingPage() {
  return (
    <MotionShell>
      <div className="relative min-h-screen overflow-x-hidden bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2]">
          {/* Hero with animated dashboard preview */}
          <Hero />
          
          {/* Social proof with logo ticker and testimonials */}
          <SocialProofSection />
          
          {/* Live dashboard preview */}
          <DashboardPreview />
          
          {/* Tabbed features section - Smartlead style */}
          <TabbedFeatures />
          
          {/* Enterprise CTA with animated metrics */}
          <EnterpriseCTA />
          
          {/* Integrations with animated flow diagram */}
          <IntegrationsSection />
          
          {/* FAQ Section */}
          <FAQSection />
          
          {/* Final CTA with footer */}
          <FinalCTA />
        </main>
      </div>
    </MotionShell>
  );
}
