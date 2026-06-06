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
    tagline: 'Small team — full AI dialer + conversation intelligence.',
    cta: 'Start free trial',
    href: APP_SIGNUP,
    popular: true,
    lead: 'Everything in Starter, plus',
    features: [
      { label: 'AI Dialer (Browse · Preview · Live)' },
      { label: 'Power Dialer with smart queue' },
      { label: 'AI brief before every call' },
      { label: 'Sentiment, intent & keyword extraction' },
      { label: 'Live manager coaching floor' },
      { label: 'Number health & spam monitoring' },
      { label: 'Inbound calling' },
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
      { label: 'Manager team performance dashboard' },
      { label: 'Workspace billing & Stripe portal' },
      { label: 'Priority support' },
      { label: 'CRM integrations', soon: true },
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
    title: 'Parallel Dialer',
    price: 'Up to 10 lines',
    desc: 'Dial multiple lines at once — first connect wins, losers auto-hang.',
    soon: false,
  },
  {
    title: 'AI Voice Agent',
    price: 'Coming soon',
    desc: 'An AI receptionist that answers, qualifies, and routes inbound calls.',
    soon: true,
  },
];
