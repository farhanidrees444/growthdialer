import type { SolutionPageData } from '@/components/marketing/SolutionPage';

export const SOLUTION_PAGES: Record<string, SolutionPageData> = {
  'sdr-teams': {
    slug: 'sdr-teams',
    eyebrow: 'SDR Teams',
    title: 'More connects.',
    titleAccent: 'Less admin after every dial.',
    description:
      'Built for reps who live in the queue: power-dial through call lists, auto-record every conversation, disposition in one click — and keep full call history on every lead.',
    pains: [
      {
        title: 'Queue friction',
        body: 'Reps lose minutes between calls updating fields. One-click dispositions keep the rhythm unbroken — every outcome logged automatically.',
      },
      {
        title: 'No context at pickup',
        body: 'AI call briefs surface company notes and prior activity before the prospect answers — no tab switching.',
      },
      {
        title: 'Coaching without shadowing',
        body: 'Managers listen on the live floor, leave feedback, and review recordings with AI summaries instead of sitting shoulder-to-shoulder.',
      },
    ],
    capabilities: [
      'Power dialer with countdown and session stats',
      'Eight dispositions with callback and meeting scheduling',
      'Call recording + AI transcription + conversation summaries',
      'Local presence numbers and spam-risk checks',
      'CRM integrations on the waitlist — CSV export today',
    ],
    outcome:
      'SDR managers get connect-rate visibility in Analytics while reps spend their shift talking — not typing.',
  },
  'ae-teams': {
    slug: 'ae-teams',
    eyebrow: 'AE Teams',
    title: 'Every discovery call',
    titleAccent: 'becomes a searchable record.',
    description:
      'AEs run fewer, higher-stakes calls. GrowthDialer captures the full conversation — transcripts, sentiment shifts, summaries — and links it all to the opportunity.',
    pains: [
      {
        title: 'Lost nuance in notes',
        body: 'AEs paraphrase; buyers forget details. Full transcripts and bullet summaries stay on the lead timeline.',
      },
      {
        title: 'Handoff gaps from SDR',
        body: 'Prior SDR calls, dispositions, and recordings roll up to one lead profile — no Slack threads to reconstruct context.',
      },
      {
        title: 'Forecast without evidence',
        body: 'Sentiment and intent tags from AI analysis give RevOps a signal beyond rep self-reporting.',
      },
    ],
    capabilities: [
      'Manual dial + click-to-call from lead detail',
      'Built-in conversation intelligence when calls are recorded',
      'Activity timeline with dispositions and notes',
      'Recording playback with keyword highlights',
      'Workspace-scoped lead and call history',
    ],
    outcome:
      'AEs close with full context. Managers review calls asynchronously instead of joining live.',
  },
  'revenue-ops': {
    slug: 'revenue-ops',
    eyebrow: 'Revenue Ops',
    title: 'Call data that',
    titleAccent: 'stays clean by default.',
    description:
      'RevOps runs on clean call objects, consistent dispositions, and exportable metrics. GrowthDialer writes structured records by default — not free-text chaos.',
    pains: [
      {
        title: 'Dirty activity data',
        body: 'Manual logging creates duplicate tasks and missing durations. Every outbound call registers once with standardized outcomes.',
      },
      {
        title: 'No funnel visibility',
        body: 'Analytics breaks down connects, meetings booked, and talk time by rep, date range, and disposition.',
      },
      {
        title: 'Integration backlog',
        body: 'Native CRM integrations are waitlist-only today. Until yours ships, CSV export keeps every record portable.',
      },
    ],
    capabilities: [
      'Disposition enum shared across the workspace',
      'Call logs and recordings with workspace isolation',
      'Dashboard KPIs and date-range analytics',
      'CSV lead import with field mapping',
      'CRM connectors in development — join the waitlist',
    ],
    outcome:
      'RevOps gets one dialer that respects data hygiene — and a straight answer on what’s live versus roadmap.',
  },
  agencies: {
    slug: 'agencies',
    eyebrow: 'Agencies',
    title: 'One dialer.',
    titleAccent: 'Separate workspaces per client.',
    description:
      'Agencies running outbound for many brands get isolated lead lists, numbers, and reporting per client — without spinning up a new vendor contract each time.',
    pains: [
      {
        title: 'Client data bleed',
        body: 'Workspace-scoped leads and calls keep Client A separate from Client B at the database level.',
      },
      {
        title: 'Per-seat pricing stacks up',
        body: 'Per-seat plans (Starter $49, Growth $79, Pro $119) scale by team size — not per-client platform fees.',
      },
      {
        title: 'Proof of performance',
        body: 'Exportable analytics and recording links give clients evidence of activity without granting dashboard access.',
      },
    ],
    capabilities: [
      'Multi-workspace switching from one login',
      'Role-based access (owner, admin, manager, agent)',
      'Per-workspace phone numbers and caller ID',
      'Team invite flow with email onboarding',
      'Recording library for QA and client reporting',
    ],
    outcome:
      'Agencies onboard a new client workspace in minutes and hand reps a dialer that already matches your playbook.',
  },
  enterprise: {
    slug: 'enterprise',
    eyebrow: 'Enterprise',
    title: 'Outbound at scale',
    titleAccent: 'with security you can audit.',
    description:
      'Enterprise sales orgs need straight answers about what ships today versus what’s roadmap — and a dialer built to pass procurement and security review.',
    pains: [
      {
        title: 'Procurement needs facts',
        body: 'We document live features (dialer, recordings, AI briefs) separately from waitlist integrations and roadmap items.',
      },
      {
        title: 'Global teams',
        body: 'WebRTC dialing from the browser — no desktop installer. Reps dial from managed laptops with standard headset hardware.',
      },
      {
        title: 'Compliance',
        body: 'Call recording with consent workflows, isolated workspaces, DNC flagging, and a full audit trail on every lead.',
      },
    ],
    capabilities: [
      'Growth and Pro tiers with volume pricing on annual plans',
      'Browser-based voice with purchased local numbers',
      'Number health and spam-risk monitoring',
      'Custom onboarding and security questionnaire support',
      'API and webhooks on the roadmap — talk to us about SLAs',
    ],
    outcome:
      'Talk to us about seat volume, CRM requirements, and deployment timeline — we will not oversell what is not live.',
  },
};
