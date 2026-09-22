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
  eyebrow: 'AI call summaries are live',
  eyebrowHref: '/features/ai',
  title: (
    <>
      The AI dialer for teams
      <br />
      that close on calls.
    </>
  ),
  lede: 'Power and parallel dialing, automatic transcripts, and AI-written call briefs — so your reps spend their hours talking, not typing.',
  primaryCta: { label: 'Start free trial', href: APP_SIGNUP },
  secondaryCta: { label: 'Watch the demo', href: '/demo' },
} as const;

export const POSITIONING = {
  line: 'All-in-one platforms treat calling as a checkbox. Multichannel tools own the inbox. GrowthDialer owns the call.',
} as const;

export const STACK_BAND = {
  eyebrow: 'Fits your stack',
  title: 'Your CRM stays. We handle the calls.',
  lede: 'GrowthDialer is the calling layer — not another system of record. Every call, recording, and AI summary is logged and exportable. Only integrations marked Live are connected in the product today; everything else is in development.',
  items: [
    { name: 'HubSpot', status: 'live' },
    { name: 'Salesforce', status: 'dev' },
    { name: 'Zapier', status: 'dev' },
    { name: 'Slack', status: 'dev' },
    { name: 'Webhooks', status: 'dev' },
    { name: 'API', status: 'dev' },
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
      body: 'HubSpot sync is live today — calls, dispositions, and recordings land on contact timelines automatically. Salesforce, Zapier, Slack, webhooks, and the API are in active development, not vaporware promises.',
    },
    {
      title: 'Compliance is the floor',
      body: 'DNC flags pull leads out of every queue instantly, opt-outs are handled automatically, and every number gets spam-risk and reputation scoring. The audit trail your legal review wants is generated as you dial.',
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  eyebrow: 'Get started',
  title: 'Live in an afternoon.',
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
  title: 'Simple pricing, per seat.',
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
  title: 'Your next call could be your next customer.',
  lede: 'Start dialing today — your first AI summary lands seconds after your first call.',
  primaryCta: { label: 'Start free trial', href: APP_SIGNUP },
  secondaryCta: { label: 'Talk to sales', href: '/contact-sales' },
} as const;

export const DIALING_PANEL = {
  eyebrow: 'The AI Dialer',
  title: 'Three ways to call. One rhythm.',
  lede: 'Manual, power, or parallel — pick the mode that fits the moment. The workflow never changes: the next call starts the second the last one is dispositioned.',
  caption: 'Actual GrowthDialer product UI — the AI Dialer.',
  modes: [
    {
      title: 'Manual',
      body: 'Click any number in your lead list and talk in seconds. WebRTC calling, right in the browser — no softphone, no desk phone.',
    },
    {
      title: 'Power',
      body: 'One list, back-to-back calls. Dispositions take one click, notes write themselves, and the next number is already ringing.',
    },
    {
      title: 'Parallel',
      body: 'Up to five lines at once. Answering-machine detection drops your voicemail and moves on — you only ever talk to humans.',
    },
  ],
} as const;

export const DASHBOARD_PANEL = {
  eyebrow: 'Command center',
  title: 'Every call, understood.',
  lede: 'The dashboard tracks what the phones are doing — and turns every recorded conversation into insight your team can actually use.',
  caption: 'Actual GrowthDialer product UI — the dashboard.',
  modes: [
    {
      title: 'AI summaries',
      body: 'Calls over 30 seconds come back with a transcript and AI summary — automatically. No rep ever types up notes again.',
    },
    {
      title: 'Team analytics',
      body: 'Calls today, connect rate, talk time, meetings booked — live on the dashboard, per rep. Coach from evidence, not anecdotes.',
    },
    {
      title: 'Guided activation',
      body: 'Claim a caller ID, import your leads, make your first call. The activation path walks a new workspace from signup to first dial in minutes.',
    },
  ],
} as const;

export const DELIVERABILITY = {
  eyebrow: 'Deliverability',
  title: 'Numbers that stay out of spam.',
  lede: 'Connect rate is a deliverability game. We watch every number like it’s our own — and the paper trail builds itself.',
  cards: [
    {
      title: 'Number health',
      body: 'Every number you own is scored for spam risk and carrier reputation — continuously. Rotate a number before it starts hurting your connect rate, not after.',
    },
    {
      title: 'Records & audit',
      body: 'Calls, recordings, transcripts, and dispositions are logged automatically. DNC flags remove leads from every queue instantly — no spreadsheet required.',
    },
  ],
} as const;

export const FOOTER_TAGLINE =
  'The AI dialer for teams that close on calls. Dial, transcribe, and follow up — from one screen.';
