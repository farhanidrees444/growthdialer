/**
 * Canonical marketing copy — single source of truth for live vs beta vs roadmap.
 * Import here instead of inventing claims in page components.
 */

export const GROWTHDIALER_PRICING = {
  starter: 'Free · 1 seat',
  proMonthly: '$49/workspace/mo',
  proAnnual: '$39/workspace/mo (annual billing)',
  proAnnualShort: '$39/mo',
  proMonthlyShort: '$49/mo',
  teamMonthly: '$99/workspace/mo',
  teamAnnual: '$79/workspace/mo (annual billing)',
  proAnnualTotal: '$468/year',
} as const;

export type ProductFeatureStatus = 'live' | 'beta' | 'roadmap';

export type AiPillar = {
  id: string;
  title: string;
  status: ProductFeatureStatus;
  /** Badge override — e.g. "Built-in" instead of "Beta" */
  statusLabel?: string;
  body: string;
  href: string;
  accent: string;
};

/** Homepage + /features/ai pillar cards */
export const AI_PILLARS: AiPillar[] = [
  {
    id: 'conversation-intelligence',
    title: 'Conversation Intelligence',
    status: 'beta',
    statusLabel: 'Built-in',
    body: 'When a call is recorded, audio is transcribed and analyzed into a summary, sentiment, intent, and next steps — linked to the lead automatically.',
    href: '/features#conversation-intelligence',
    accent: '#06B6D4',
  },
  {
    id: 'call-brief',
    title: 'AI Call Brief',
    status: 'live',
    body: 'Before you dial, see company context, past notes, and a one-line opener tailored to the lead — right in the dialer.',
    href: '/features/ai#call-brief',
    accent: '#8B5CF6',
  },
  {
    id: 'coaching',
    title: 'Live Coaching',
    status: 'beta',
    statusLabel: 'Listen mode',
    body: 'Managers on Pro and Team plans monitor active calls in listen mode and leave structured feedback after hang-up. Whisper and barge audio are on the roadmap.',
    href: '/features/ai#coaching',
    accent: '#10B981',
  },
  {
    id: 'voice-agent',
    title: 'AI Voice Agent',
    status: 'roadmap',
    body: 'Inbound AI receptionist that answers, qualifies, and books meetings — the next pillar in the GrowthDialer platform.',
    href: '/features/ai#voice-agent',
    accent: '#F59E0B',
  },
];

export const AI_PILLARS_HEADLINE = 'Four pillars. Two live · one built-in · one roadmap.';

export const AI_PILLARS_SUBHEAD =
  'GrowthDialer ships AI where it removes work — prep before the call, analysis after, coaching for managers — with a clear label on what is live today.';

/** Stats strip — no vanity percentages we cannot verify fleet-wide */
export const MARKETING_STATS = [
  { to: 50, suffix: '+', label: 'Countries you can dial', prefix: '' },
  { to: 3, suffix: '', label: 'AI Dialer focus modes', prefix: '' },
  { to: 8, suffix: '', label: 'Disposition outcomes built in', prefix: '' },
  { to: 4, suffix: 's', label: 'Target time to AI summary', prefix: '<' },
] as const;

/** Shipped and testable in production today */
export const LIVE_TODAY = [
  'WebRTC outbound dialer + AI Dialer focus stages',
  'Power dialer + parallel dial (up to 10 lines on Pro)',
  'AI call brief before each dial',
  'Leads import, dispositions, analytics, call logs',
  'HubSpot OAuth + call logging on disposition',
  'Sequences (multi-step cadences)',
  'Team workspaces + role-based access',
  'Number health monitoring',
  'Voicemail library + drop on live calls',
] as const;

/** In product but depends on recording pipeline or partial implementation */
export const BETA_TODAY = [
  'Conversation intelligence (transcribe → summary, sentiment, intent when recording saves)',
  'Coaching floor — listen mode + post-call feedback',
  'Inbound browser ringing (routing in Settings)',
] as const;

/** Actively building — may exist in UI as waitlist or stub */
export const IN_PROGRESS = [
  'Recording + AI pipeline reliability at scale',
  'Coaching whisper / barge via voice bridge',
  'Salesforce + additional CRM connectors',
  'Inbound WebRTC audio polish',
] as const;

/** Not shipped — label clearly on site */
export const ROADMAP_NOT_LIVE = [
  'Autonomous AI voice agents (inbound receptionist)',
  'CRM sync beyond HubSpot (Salesforce, Pipedrive, etc.)',
  'Public REST API',
  'SOC 2 certification',
  'Bring-your-own-number porting',
] as const;

export const HOME_FAQ_LIVE_VS_ROADMAP =
  'Live today: AI Dialer, Power Dialer, parallel dial, AI call briefs, leads, analytics, call logs, HubSpot connect, sequences, team workspaces (Team plan), and number-health monitoring. Built-in: conversation intelligence and coaching listen mode when calls are recorded. Roadmap: AI voice agents, whisper/barge coaching audio, CRM connectors beyond HubSpot, and full inbound polish — always labeled on the site.';

export const PRICING_FAQ_ROADMAP =
  'Live on Pro and Team: power + parallel dial, AI briefs, coaching floor (listen + feedback), and team analytics. Built-in when recording saves: transcription, summaries, and sentiment. Roadmap: AI voice agent, whisper/barge coaching, Salesforce, and public API — we label waitlist items until they ship.';

export const EDITORIAL_DISCLAIMER =
  'Editorial note: Competitor pricing and features reflect public list prices as of April 2026. Verify with each vendor before purchasing. GrowthDialer labels live vs roadmap features on our site — this article follows the same standard.';

export const NO_VANITY_METRICS =
  'We do not publish customer counts, star ratings, or performance guarantees we cannot verify. Start free and judge the product on your own calls.';

export const AUTHOR_BIO =
  'Written by the GrowthDialer team from hands-on product testing and outbound practice. Live features are separated from roadmap items in every guide.';

export const BLOG_CTA =
  'Start free on Starter — dial, record, and test AI summaries on your own calls. Upgrade to Pro when your team needs parallel dial and the coaching floor.';

/** @deprecated Use LIVE_TODAY — kept for older imports */
export const SHIPPED_TODAY = LIVE_TODAY;
