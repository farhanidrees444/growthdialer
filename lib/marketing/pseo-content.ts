import type { Metadata } from 'next';
import type { PseoCompetitor } from './pseo-competitors';
import { GROWTHDIALER_PRICE } from './pseo-competitors';
import { MARKETING_SITE } from './navigation';

export function buildVsPageMetadata(competitor: PseoCompetitor): Metadata {
  const title = `${competitor.name} Alternative — GrowthDialer AI Sales Dialer`;
  const description = `Looking for a ${competitor.name} alternative? Meet GrowthDialer — the AI-native power dialer with conversation intelligence, call recording, and workspace pricing from ${GROWTHDIALER_PRICE}/mo. Compare features and pricing side-by-side.`;
  const url = `${MARKETING_SITE}/vs/${competitor.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `GrowthDialer vs ${competitor.name}`,
      description: `Compare GrowthDialer and ${competitor.name} — AI summaries, power dialing, and transparent workspace pricing.`,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export function buildVsHeroTitle(competitor: PseoCompetitor): string {
  return `${competitor.name} dials. GrowthDialer understands every call.`;
}

export function buildVsHeroSubtitle(competitor: PseoCompetitor): string {
  return `${competitor.positioning} GrowthDialer adds AI transcription, summaries, sentiment, and a live coaching floor — with workspace pricing from ${GROWTHDIALER_PRICE}/mo and a free Starter tier.`;
}

export function buildValueProps(competitor: PseoCompetitor) {
  const priceNote =
    competitor.priceModel === 'per-seat'
      ? `${competitor.name} bills per seat — costs compound as you hire.`
      : competitor.priceModel === 'custom'
        ? `${competitor.name} typically requires custom enterprise quotes.`
        : `${competitor.name} uses workspace-style pricing — compare total cost at your team size.`;

  return [
    {
      title: 'Intelligence included, not bolted on',
      description: `${competitor.name} is known for ${competitor.knownFor}. GrowthDialer ships AI summaries, sentiment, and a searchable recording library on every plan — no separate conversation-intelligence SKU.`,
    },
    {
      title: 'Transparent workspace pricing',
      description: `${priceNote} GrowthDialer Pro is ${GROWTHDIALER_PRICE}/workspace/mo with parallel dial, coaching, and HubSpot sync included.`,
    },
    {
      title: 'Start free before you commit',
      description: `Validate call quality and AI briefs on GrowthDialer Starter (free) before rolling out seats — no annual contract required.`,
    },
    {
      title: 'Built for managers who review async',
      description: `Live coaching floor, disposition tracking, and AI insights mean managers coach from recordings — not only live shoulder-surfing.`,
    },
  ];
}

export function buildVsFaqs(competitor: PseoCompetitor) {
  return [
    {
      question: `Is GrowthDialer a good ${competitor.name} alternative?`,
      answer: `Yes — if you need AI call summaries, conversation intelligence, and workspace pricing alongside power or parallel dialing. ${competitor.name} excels at ${competitor.knownFor}; GrowthDialer adds intelligence on every recorded conversation.`,
    },
    {
      question: `How does GrowthDialer pricing compare to ${competitor.name}?`,
      answer: `GrowthDialer Pro starts at ${GROWTHDIALER_PRICE}/workspace/mo with a free Starter tier. ${competitor.name} public pricing starts around ${competitor.priceFrom} (${competitor.priceModel.replace('-', ' ')}). Compare total cost at your team size before switching.`,
    },
    {
      question: `Can I migrate from ${competitor.name} to GrowthDialer?`,
      answer: `Import leads via CSV, connect HubSpot for call logging, and configure webhooks for your stack. Most teams run GrowthDialer alongside their existing CRM during a phased rollout.`,
    },
  ];
}

export function buildVsJsonLd(competitor: PseoCompetitor) {
  const url = `${MARKETING_SITE}/vs/${competitor.slug}`;
  const faqs = buildVsFaqs(competitor);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `GrowthDialer vs ${competitor.name}`,
      description: buildVsHeroSubtitle(competitor),
      url,
      isPartOf: { '@type': 'WebSite', name: 'GrowthDialer', url: MARKETING_SITE },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
  ];
}
