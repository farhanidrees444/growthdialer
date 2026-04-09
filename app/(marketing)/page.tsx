import HeroSection from "@/components/marketing/HeroSection";
import Ticker from "@/components/marketing/Ticker";
import IntegrationsBar from "@/components/marketing/IntegrationsBar";
import HowItWorks from "@/components/marketing/HowItWorks";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import StatsBand from "@/components/marketing/StatsBand";
import CompareTable from "@/components/marketing/CompareTable";
import PricingSection from "@/components/marketing/PricingSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import FAQSection from "@/components/marketing/FAQSection";
import CompareSection from "@/components/marketing/CompareSection";
import CTASection from "@/components/marketing/CTASection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <Ticker />
      <IntegrationsBar />
      <HowItWorks />
      <FeaturesSection />
      <StatsBand />
      <CompareTable />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CompareSection />
      <CTASection />
    </>
  );
}
