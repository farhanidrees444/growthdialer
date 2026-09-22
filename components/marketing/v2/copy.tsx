/**
 * Shared marketing copy deck — GrowthDialer premium redo.
 * Rules: specific over generic, benefit-led, zero fluff.
 * HARD RULE: no invented traction, revenue, user counts, names, or logos.
 */
import { APP_SIGNIN, APP_SIGNUP } from '@/lib/marketing/navigation';

export { APP_SIGNIN, APP_SIGNUP };

export const RISK_BULLETS = [
  '7-day free trial',
  'No credit card required',
  'Cancel anytime',
] as const;

export const HERO = {
  eyebrow: 'Parallel dialing is live',
  eyebrowHref: '/features',
  title: (
    <>
      Your reps were hired to <span className="text-[#6d28d9]">talk.</span>
      <br />
      Not to type.
    </>
  ),
  lede: 'GrowthDialer puts five lines on every rep, transcribes every call, and writes the notes and follow-ups — while your CRM stays exactly where it is.',
  primaryCta: { label: 'Start free trial', href: APP_SIGNUP },
  secondaryCta: { label: 'Take the product tour', href: '/demo' },
} as const;

export const PROOF = {
  eyebrow: 'Radical honesty',
  title: (
    <>
      Four pillars. Three live —<br className="hidden sm:block" /> one in development.
    </>
  ),
  lede: 'No vaporware, no demo checkboxes. If it isn’t live, it’s labeled — right here, before you sign up.',
  pillars: [
    {
      name: 'Dialing',
      status: 'live' as const,
      fact: '3 modes · 5 parallel lines',
      body: 'Power, parallel, and click-to-call — in your browser, on every plan, from the first call.',
    },
    {
      name: 'Call intelligence',
      status: 'live' as const,
      fact: '8 dispositions · AI briefs',
      body: 'Transcription, summaries, sentiment, and coaching signals on every recorded call.',
    },
    {
      name: 'Number health',
      status: 'live' as const,
      fact: 'Spam-risk scoring',
      body: 'Every number you own, scored for spam risk and watched continuously.',
    },
    {
      name: 'AI receptionist',
      status: 'dev' as const,
      fact: 'In development',
      body: 'Answers, routes, and books when your team can’t pick up. On the roadmap — deliberately not on the pricing page.',
    },
  ],
  facts: ['3 dialing modes', '8 dispositions', '5 parallel lines', '7-day trial'],
} as const;

export const POSITIONING = {
  line: 'All-in-one platforms treat calling as a checkbox. Multichannel tools own the inbox. GrowthDialer owns the call.',
} as const;

export const STACK_BAND = {
  eyebrow: 'Fits your stack',
  title: 'Your CRM stays. We handle the calls.',
  lede: 'GrowthDialer is the calling layer — not another system of record. HubSpot syncs today; everything else below is honestly labeled, and every call stays logged and exportable either way.',
  items: [
    { name: 'HubSpot', status: 'live' as const },
    { name: 'Salesforce', status: 'dev' as const },
    { name: 'Zapier', status: 'roadmap' as const },
    { name: 'Slack', status: 'roadmap' as const },
    { name: 'Webhooks', status: 'roadmap' as const },
    { name: 'API', status: 'roadmap' as const },
  ],
} as const;

export const PERSONAS = {
  eyebrow: "Who it's for",
  title: 'Built for the people who live on the phone.',
  cards: [
    {
      role: 'SDRs',
      headline: 'Book more meetings per hour.',
      body: 'Parallel dialing and one-click dispositions turn a list of 200 names into a day of real conversations.',
    },
    {
      role: 'Account executives',
      headline: 'Walk into every call prepared.',
      body: 'AI briefs from previous calls mean you never open with “so, where were we?” again.',
    },
    {
      role: 'Sales managers',
      headline: 'Coach from evidence, not anecdotes.',
      body: 'Listen live, read the AI summary, and know exactly which rep needs help with what.',
    },
    {
      role: 'Founders',
      headline: 'Sell like a team of ten.',
      body: 'One founder, one list, one dialer — with the follow-up discipline of an entire ops team.',
    },
  ],
} as const;

export const TRUST = {
  eyebrow: 'Why teams switch',
  title: 'All-in-ones give you fifty tools and one mediocre dialer.',
  lede: 'We made the opposite trade. One surface — the call — engineered deeper than anyone else in the category.',
  items: [
    {
      title: 'Voice-first by design',
      body: 'Every screen serves the conversation: dial, talk, disposition, follow up. Nothing in the product exists to upsell you a funnel builder.',
    },
    {
      title: 'Plays well with your CRM',
      body: 'HubSpot syncs calls today; Salesforce, Zapier, and webhooks are in development. Until then, every call is logged and exportable — no migration, no duplicate records.',
    },
    {
      title: 'Compliance is the floor',
      body: '10DLC registration, automatic opt-out handling, DNC respect, and recording consent — handled before your first call, not after your first complaint.',
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  eyebrow: 'Get started',
  title: 'Three steps to your first call.',
  steps: [
    {
      title: 'Import your list',
      body: 'Upload a CSV or sync HubSpot. Leads, owners, and call history come with it — done in minutes.',
    },
    {
      title: 'Connect a number',
      body: 'Bring your own numbers or buy local ones in-app. Health scoring starts immediately.',
    },
    {
      title: 'Dial',
      body: 'Pick power, parallel, or click-to-call. Transcripts and AI briefs start on the very first call.',
    },
  ],
} as const;

export const PRICING_TEASER = {
  eyebrow: 'Pricing',
  title: 'One seat. The whole dialer.',
  lede: 'Every plan includes unlimited calling workflows, AI summaries, and the full dialer. 20% off annual.',
  plans: [
    { name: 'Starter', price: '$39', tag: 'For solo reps getting started', popular: false },
    { name: 'Growth', price: '$63', tag: 'For teams running daily outbound', popular: true },
    { name: 'Pro', price: '$95', tag: 'For orgs that live on the phone', popular: false },
  ],
  cta: { label: 'See full pricing', href: '/pricing' },
} as const;

export const FAQS = [
  {
    q: 'Is there really a free trial?',
    a: 'Yes — 7 days of the full product, no credit card required. If it doesn’t earn its seat, cancel in one click.',
  },
  {
    q: 'Do I need special hardware or a phone system?',
    a: 'No. Calls run in your browser over WebRTC with one click. Bring your own numbers or buy local ones inside the app.',
  },
  {
    q: 'Will GrowthDialer replace my CRM?',
    a: 'No — and it doesn’t try to. GrowthDialer is the calling layer: every call, recording, and AI brief is logged and exportable. Native CRM integrations are in development — join the waitlist for first access.',
  },
  {
    q: 'How do you handle call compliance?',
    a: 'DNC flagging is built into the dialer — flagged leads leave every queue instantly. Your numbers get spam-risk and reputation scoring, and every call is logged with its recording, transcript, and disposition history.',
  },
  {
    q: 'Is the AI receptionist included?',
    a: 'Not yet — it’s on our roadmap and in active development. Today you get AI call summaries, transcription, sentiment, and coaching intelligence on every call.',
  },
  {
    q: 'Can I use my existing phone numbers?',
    a: 'Yes. Connect the numbers you already own, or purchase new local numbers in-app. Every number gets spam-risk and reputation scoring.',
  },
] as const;

export const FINAL_CTA = {
  title: 'Start your 7-day trial.',
  lede: 'Every call transcribed, briefed, and logged. No credit card, no sales call required.',
  primaryCta: { label: 'Start free trial', href: APP_SIGNUP },
  secondaryCta: { label: 'Talk to sales', href: '/contact-sales' },
} as const;

export const FOOTER_TAGLINE =
  'The AI dialer for teams that close on calls. Dial, transcribe, and follow up — from one screen.';
