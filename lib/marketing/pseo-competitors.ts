/**
 * Programmatic SEO competitor catalog — single source of truth for /vs/[competitor].
 * Add a row here; sitemap, metadata, and page content generate automatically.
 */

export type CompetitorCategory =
  | 'parallel-dialer'
  | 'power-dialer'
  | 'voip'
  | 'conversation-intelligence';

export type PriceModel = 'per-seat' | 'workspace' | 'custom';

export type FeatureKey =
  | 'powerDialing'
  | 'parallelDialing'
  | 'aiSummaries'
  | 'conversationIntel'
  | 'liveCoaching'
  | 'crmSync'
  | 'freeTier'
  | 'localPresence'
  | 'callRecording';

export type PseoCompetitor = {
  slug: string;
  name: string;
  domain: string;
  category: CompetitorCategory;
  priceFrom: string;
  priceModel: PriceModel;
  /** Short positioning line for hero subtitle */
  positioning: string;
  /** Used in auto-generated value props */
  knownFor: string;
  featureOverrides?: Partial<Record<FeatureKey, boolean | string>>;
  sitemapPriority?: number;
};

export const GROWTHDIALER_PRICE = '$49';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  powerDialing: 'Power dialing',
  parallelDialing: 'Parallel dialing (multi-line)',
  aiSummaries: 'AI call summaries',
  conversationIntel: 'Conversation intelligence',
  liveCoaching: 'Live manager coaching floor',
  crmSync: 'CRM call logging',
  freeTier: 'Free tier to start',
  localPresence: 'Local presence numbers',
  callRecording: 'Call recording & library',
};

const CATEGORY_DEFAULTS: Record<
  CompetitorCategory,
  Record<FeatureKey, boolean | string>
> = {
  'parallel-dialer': {
    powerDialing: true,
    parallelDialing: true,
    aiSummaries: false,
    conversationIntel: false,
    liveCoaching: false,
    crmSync: true,
    freeTier: false,
    localPresence: true,
    callRecording: true,
  },
  'power-dialer': {
    powerDialing: true,
    parallelDialing: false,
    aiSummaries: false,
    conversationIntel: false,
    liveCoaching: false,
    crmSync: true,
    freeTier: false,
    localPresence: true,
    callRecording: true,
  },
  voip: {
    powerDialing: false,
    parallelDialing: false,
    aiSummaries: false,
    conversationIntel: false,
    liveCoaching: false,
    crmSync: 'Add-on',
    freeTier: false,
    localPresence: true,
    callRecording: 'Add-on',
  },
  'conversation-intelligence': {
    powerDialing: true,
    parallelDialing: true,
    aiSummaries: true,
    conversationIntel: true,
    liveCoaching: 'Limited',
    crmSync: true,
    freeTier: false,
    localPresence: true,
    callRecording: true,
  },
};

export const GROWTHDIALER_FEATURES: Record<FeatureKey, boolean | string> = {
  powerDialing: true,
  parallelDialing: 'Up to 10 lines',
  aiSummaries: true,
  conversationIntel: true,
  liveCoaching: true,
  crmSync: 'HubSpot live',
  freeTier: true,
  localPresence: true,
  callRecording: true,
};

/** Competitors indexed by programmatic /vs/[slug] routes */
export const PSEO_COMPETITORS: PseoCompetitor[] = [
  {
    slug: 'orum',
    name: 'Orum',
    domain: 'orum.com',
    category: 'parallel-dialer',
    priceFrom: '$59+',
    priceModel: 'per-seat',
    positioning: 'Parallel dialer built for high-volume SDR teams with strong CRM integrations.',
    knownFor: 'parallel dialing throughput',
  },
  {
    slug: 'nooks',
    name: 'Nooks',
    domain: 'nooks.ai',
    category: 'parallel-dialer',
    priceFrom: '$49+',
    priceModel: 'per-seat',
    positioning: 'Virtual salesfloor with parallel dial and rep gamification.',
    knownFor: 'virtual salesfloor energy',
  },
  {
    slug: 'kixie',
    name: 'Kixie',
    domain: 'kixie.com',
    category: 'power-dialer',
    priceFrom: '$65+',
    priceModel: 'per-seat',
    positioning: 'CRM-embedded power dialer with automations and local presence.',
    knownFor: 'CRM power-ups and click-to-call',
  },
  {
    slug: 'phoneburner',
    name: 'PhoneBurner',
    domain: 'phoneburner.com',
    category: 'power-dialer',
    priceFrom: '$149+',
    priceModel: 'per-seat',
    positioning: 'Classic power dialer focused on outbound call volume.',
    knownFor: 'simple power dial workflows',
  },
  {
    slug: 'powerdialer',
    name: 'PowerDialer',
    domain: 'powerdialer.com',
    category: 'power-dialer',
    priceFrom: '$99+',
    priceModel: 'per-seat',
    positioning: 'Legacy power dialer for insurance and B2C outbound teams.',
    knownFor: 'high-volume outbound dialing',
  },
  {
    slug: 'ringdna',
    name: 'RingDNA',
    domain: 'ringdna.com',
    category: 'conversation-intelligence',
    priceFrom: '$75+',
    priceModel: 'per-seat',
    positioning: 'Revenue intelligence platform with Salesforce-native call analytics.',
    knownFor: 'Salesforce conversation analytics',
    featureOverrides: { crmSync: 'Salesforce-first' },
  },
  {
    slug: 'krispcall',
    name: 'KrispCall',
    domain: 'krispcall.com',
    category: 'voip',
    priceFrom: '$15+',
    priceModel: 'per-seat',
    positioning: 'Cloud business phone system with basic team calling features.',
    knownFor: 'affordable cloud telephony',
  },
  {
    slug: 'ringcentral',
    name: 'RingCentral',
    domain: 'ringcentral.com',
    category: 'voip',
    priceFrom: '$30+',
    priceModel: 'per-seat',
    positioning: 'Enterprise UCaaS phone system with broad communications features.',
    knownFor: 'enterprise phone system scale',
  },
  {
    slug: 'aircall',
    name: 'Aircall',
    domain: 'aircall.io',
    category: 'voip',
    priceFrom: '$30+',
    priceModel: 'per-seat',
    positioning: 'Cloud call center software with CRM integrations for support and sales.',
    knownFor: 'cloud call center setup',
  },
  {
    slug: 'dialpad',
    name: 'Dialpad',
    domain: 'dialpad.com',
    category: 'voip',
    priceFrom: '$15+',
    priceModel: 'per-seat',
    positioning: 'AI-powered business communications with voice, video, and messaging.',
    knownFor: 'unified communications',
    featureOverrides: { aiSummaries: 'Limited', conversationIntel: 'Limited' },
  },
  {
    slug: 'justcall',
    name: 'JustCall',
    domain: 'justcall.io',
    category: 'voip',
    priceFrom: '$19+',
    priceModel: 'per-seat',
    positioning: 'Cloud phone for sales and support with CRM dialer add-ons.',
    knownFor: 'quick CRM phone setup',
  },
  {
    slug: 'convoso',
    name: 'Convoso',
    domain: 'convoso.com',
    category: 'power-dialer',
    priceFrom: 'Custom',
    priceModel: 'custom',
    positioning: 'Outbound contact center dialer for high-volume lead gen teams.',
    knownFor: 'contact center predictive dial',
    featureOverrides: { parallelDialing: true },
  },
  {
    slug: 'readymode',
    name: 'ReadyMode',
    domain: 'readymode.com',
    category: 'power-dialer',
    priceFrom: '$99+',
    priceModel: 'per-seat',
    positioning: 'All-in-one dialer and CRM for inside sales teams.',
    knownFor: 'dialer plus built-in CRM',
  },
  {
    slug: 'dandydialer',
    name: 'DandyDialer',
    domain: 'dandydialer.com',
    category: 'power-dialer',
    priceFrom: '$49+',
    priceModel: 'per-seat',
    positioning: 'Lightweight power dialer for solo reps and small teams.',
    knownFor: 'simple affordable dialing',
  },
  {
    slug: 'connectandsell',
    name: 'ConnectAndSell',
    domain: 'connectandsell.com',
    category: 'parallel-dialer',
    priceFrom: 'Custom',
    priceModel: 'custom',
    positioning: 'Agent-assisted parallel dialing for enterprise outbound orgs.',
    knownFor: 'agent-assisted connect rates',
  },
  {
    slug: 'salesloft',
    name: 'Salesloft',
    domain: 'salesloft.com',
    category: 'conversation-intelligence',
    priceFrom: '$125+',
    priceModel: 'per-seat',
    positioning: 'Revenue orchestration platform with cadences, dialer, and conversation AI.',
    knownFor: 'sales engagement cadences',
  },
  {
    slug: 'outreach',
    name: 'Outreach',
    domain: 'outreach.io',
    category: 'conversation-intelligence',
    priceFrom: '$100+',
    priceModel: 'per-seat',
    positioning: 'Enterprise sales engagement with sequences, dialer, and forecasting.',
    knownFor: 'enterprise sales engagement',
  },
  {
    slug: 'apollo',
    name: 'Apollo.io',
    domain: 'apollo.io',
    category: 'power-dialer',
    priceFrom: '$49+',
    priceModel: 'per-seat',
    positioning: 'Prospecting database with built-in sequences and dialer.',
    knownFor: 'prospect data plus outreach',
    featureOverrides: { parallelDialing: false, liveCoaching: false },
  },
  {
    slug: 'close',
    name: 'Close',
    domain: 'close.com',
    category: 'power-dialer',
    priceFrom: '$49+',
    priceModel: 'per-seat',
    positioning: 'CRM-first sales platform with built-in calling and email.',
    knownFor: 'CRM with native calling',
  },
  {
    slug: 'mojo',
    name: 'Mojo Dialer',
    domain: 'mojosells.com',
    category: 'power-dialer',
    priceFrom: '$99+',
    priceModel: 'per-seat',
    positioning: 'Real estate and local business power dialer with mobile apps.',
    knownFor: 'mobile-first power dial',
  },
  {
    slug: 'smartlead',
    name: 'Smartlead',
    domain: 'smartlead.ai',
    category: 'power-dialer',
    priceFrom: '$39+',
    priceModel: 'workspace',
    positioning: 'Cold email outbound platform — teams often pair it with a separate dialer.',
    knownFor: 'email deliverability infrastructure',
    featureOverrides: {
      powerDialing: false,
      parallelDialing: false,
      callRecording: false,
      localPresence: false,
    },
  },
  {
    slug: 'instantly',
    name: 'Instantly',
    domain: 'instantly.ai',
    category: 'power-dialer',
    priceFrom: '$37+',
    priceModel: 'workspace',
    positioning: 'Email automation platform — phone is not the core product.',
    knownFor: 'cold email at scale',
    featureOverrides: {
      powerDialing: false,
      parallelDialing: false,
      callRecording: false,
      localPresence: false,
    },
  },
];

export function getCompetitorBySlug(slug: string): PseoCompetitor | undefined {
  const normalized = slug.toLowerCase().trim();
  return PSEO_COMPETITORS.find((c) => c.slug === normalized);
}

export function getAllCompetitorSlugs(): string[] {
  return PSEO_COMPETITORS.map((c) => c.slug);
}

export function getCompetitorFeatures(
  competitor: PseoCompetitor,
): Record<FeatureKey, boolean | string> {
  const base = { ...CATEGORY_DEFAULTS[competitor.category] };
  if (competitor.featureOverrides) {
    Object.assign(base, competitor.featureOverrides);
  }
  return base;
}

export function getFeatureRows(competitor: PseoCompetitor) {
  const theirs = getCompetitorFeatures(competitor);
  return (Object.keys(FEATURE_LABELS) as FeatureKey[]).map((key) => ({
    feature: FEATURE_LABELS[key],
    growthdialer: GROWTHDIALER_FEATURES[key],
    competitor: theirs[key],
  }));
}

export function parsePriceNumber(price: string): number {
  const match = price.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 99;
}

export function getRelatedCompetitors(current: PseoCompetitor, limit = 4): PseoCompetitor[] {
  return PSEO_COMPETITORS.filter(
    (c) => c.slug !== current.slug && c.category === current.category,
  )
    .slice(0, limit)
    .concat(
      PSEO_COMPETITORS.filter(
        (c) => c.slug !== current.slug && c.category !== current.category,
      ).slice(0, Math.max(0, limit - 2)),
    )
    .slice(0, limit);
}
