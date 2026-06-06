/**
 * Canonical marketing copy — no vanity metrics, no unverified ratings.
 * Aligns with lib/marketing/pricing.ts and shipped product scope.
 */

export const GROWTHDIALER_PRICING = {
  starter: 'Free · 1 seat',
  proMonthly: '$49/workspace/mo',
  proAnnual: '$39/workspace/mo (annual billing)',
  proAnnualShort: '$39/mo',
  proMonthlyShort: '$49/mo',
  teamMonthly: '$99/workspace/mo',
  teamAnnual: '$79/workspace/mo (annual billing)',
  /** Pro annual total for ROI examples */
  proAnnualTotal: '$468/year',
} as const;

/** What GrowthDialer ships in production today */
export const SHIPPED_TODAY = [
  'Web dialer with AI Dialer focus stages (Browse · Preview · Live)',
  'Power + parallel dial (up to 10 lines on Pro)',
  'Call recording, transcription, AI summaries & sentiment',
  'Live manager coaching floor + whisper mode',
  'HubSpot integration (live)',
  'Leads import, dispositions, analytics',
] as const;

/** Explicitly not shipped — label on roadmap in UI */
export const ROADMAP_NOT_LIVE = [
  'Autonomous AI voice agents that run full conversations',
  'CRM sync beyond HubSpot (Salesforce, Outreach, etc.)',
] as const;

export const EDITORIAL_DISCLAIMER =
  'Editorial note: Competitor pricing and features reflect public list prices as of April 2026. Verify with each vendor before purchasing. GrowthDialer labels live vs roadmap features on our site — this article follows the same standard.';

export const NO_VANITY_METRICS =
  'We do not publish customer counts, star ratings, or performance guarantees we cannot verify. Start free and judge the product on your own calls.';

export const AUTHOR_BIO =
  'Written by the GrowthDialer team from hands-on product testing and outbound practice. Live features are separated from roadmap items in every guide.';

export const BLOG_CTA =
  'Start free on Starter — recording and AI summaries included. Upgrade to Pro when your team needs parallel dial and coaching.';
