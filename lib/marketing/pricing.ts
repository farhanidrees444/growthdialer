/**
 * Public marketing pricing — aligned with in-app workspace plans
 * (free / pro / team / enterprise) in lib/billing/workspace-plans.ts
 */

export type MarketingPlanId = 'starter' | 'pro' | 'team' | 'enterprise';

export interface MarketingPlan {
  id: MarketingPlanId;
  name: string;
  /** Matches workspace.plan when subscribed */
  workspacePlan: 'free' | 'pro' | 'team' | 'enterprise';
  monthly: number | null;
  annual: number | null;
  seats: string;
  tagline: string;
  cta: string;
  href: string;
  popular?: boolean;
  lead?: string;
  features: { label: string; soon?: boolean }[];
}

export const MARKETING_SITE = 'https://growthdialer.com';
export const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    workspacePlan: 'free',
    monthly: 0,
    annual: 0,
    seats: '1 seat',
    tagline: 'Solo rep — dial, record, and get AI summaries free.',
    cta: 'Start free',
    href: APP_SIGNUP,
    features: [
      { label: 'Web dialer + click-to-call' },
      { label: 'Call recording' },
      { label: 'Leads import & pipeline' },
      { label: 'AI call summaries' },
      { label: 'Basic analytics' },
      { label: '1 local number' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    workspacePlan: 'pro',
    monthly: 49,
    annual: 39,
    seats: 'Up to 3 seats',
    tagline: 'Small team — parallel dial, AI briefs, and built-in call intelligence.',
    cta: 'Start free trial',
    href: APP_SIGNUP,
    popular: true,
    lead: 'Everything in Starter, plus',
    features: [
      { label: 'AI Dialer (Browse · Preview · Live)' },
      { label: 'Power + Parallel Dialer (up to 10 lines)' },
      { label: 'Parallel dial + voicemail drop on sessions' },
      { label: 'Local presence caller ID rotation' },
      { label: 'AI brief before every call' },
      { label: 'Sentiment, intent & keywords (when recorded)' },
      { label: 'Coaching floor — listen + feedback' },
      { label: 'Whisper / barge coaching audio', soon: true },
      { label: 'Number health & spam monitoring' },
      { label: 'Inbound browser ringing' },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    workspacePlan: 'team',
    monthly: 99,
    annual: 79,
    seats: 'Up to 10 seats',
    tagline: 'Growing sales floor — workspaces, roles, and team analytics.',
    cta: 'Start free trial',
    href: APP_SIGNUP,
    lead: 'Everything in Pro, plus',
    features: [
      { label: 'Team workspaces & role permissions' },
      { label: 'Invite members + seat management' },
      { label: 'Team leaderboard & connect-rate wall' },
      { label: 'Custom dispositions per workspace' },
      { label: 'Sequences / sales cadences' },
      { label: 'HubSpot call logging' },
      { label: 'Manager team performance dashboard' },
      { label: 'Workspace billing & self-serve portal' },
      { label: 'Priority support' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    workspacePlan: 'enterprise',
    monthly: null,
    annual: null,
    seats: 'Unlimited seats',
    tagline: 'High-volume teams with custom limits and onboarding.',
    cta: 'Contact sales',
    href: '/contact-sales',
    lead: 'Everything in Team, plus',
    features: [
      { label: 'Volume discounts' },
      { label: 'Dedicated success manager' },
      { label: 'Custom onboarding & SLA' },
      { label: 'SSO & advanced security', soon: true },
    ],
  },
];

export const MARKETING_ADDONS = [
  {
    title: 'Additional numbers',
    price: 'from $3 / number / mo',
    desc: 'Add local caller-ID lines as your team scales.',
    soon: false,
  },
  {
    title: 'Extra parallel lines',
    price: 'Up to 10 lines on Pro+',
    desc: 'AMD skip + auto VM drop on machines — included in Pro and Team plans.',
    soon: false,
  },
  {
    title: 'AI Voice Agent',
    price: 'Coming soon',
    desc: 'An AI receptionist that answers, qualifies, and routes inbound calls.',
    soon: true,
  },
];
