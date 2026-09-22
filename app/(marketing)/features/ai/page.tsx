import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Faq, PricingTeaser } from '@/components/marketing/v2/Sections';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { FeaturePageCta } from '@/components/marketing/pages/features-floorplan';
import { AiHero, AiStages, AiHonesty, AiRoadmap } from '@/components/marketing/pages/features-ai';

export const metadata: Metadata = {
  title: 'AI Platform — Conversation Intelligence, Coaching & Voice Agents',
  description:
    'GrowthDialer AI: call briefs live today, conversation intelligence built in when calls are recorded, coaching listen mode on Pro, and the AI voice agent on the roadmap.',
  alternates: { canonical: `${MARKETING_SITE}/features/ai` },
  openGraph: {
    title: 'GrowthDialer AI Platform',
    description: 'AI that works before, during, and after every sales call — labeled live or roadmap, honestly.',
    url: `${MARKETING_SITE}/features/ai`,
  },
};

const AI_FAQS = [
  {
    q: 'Is the AI voice agent available?',
    a: 'Not yet. The inbound AI receptionist — answers, qualifies, and routes calls — is in active development. Today you get AI call briefs, transcription, summaries, sentiment, and coaching intelligence on every recorded call.',
  },
  {
    q: 'Which AI features are live today?',
    a: 'AI call briefs before each dial, transcription and summaries when calls are recorded, sentiment and keyword analysis, and coaching listen mode for managers. Whisper/barge coaching is coming soon; the voice agent is in development.',
  },
  {
    q: 'Do I have to trust the AI blindly?',
    a: 'No. Every brief links back to the transcript and recording it was written from. Reps read the 30-second brief; managers can always verify against the source.',
  },
  {
    q: 'Does AI work on unrecorded calls?',
    a: 'Transcription, summaries, and sentiment need a recording to work from. Recording is automatic on browser calls, with consent controls built in.',
  },
] as const;

export default function AiFeaturesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <AiHero />
        <AiStages />
        <AiHonesty />
        <AiRoadmap />
        <PricingTeaser />
        <div className="pm-divider">
          <Faq items={AI_FAQS} eyebrow="AI FAQ" title="Honest answers about the AI." />
        </div>
        <FeaturePageCta
          eyebrow="The intelligence issue"
          title="Put the brief to work."
          lede="AI briefs, transcription, and sentiment — live on every recorded call, readable in 30 seconds. Free for 7 days, no credit card."
          secondary={{ label: 'Read the floor plan', href: '/features' }}
        />
      </main>
      <Footer />
    </div>
  );
}
