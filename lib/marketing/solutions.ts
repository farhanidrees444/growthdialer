import type { SolutionPageData } from '@/components/marketing/SolutionPage';

export const SOLUTION_PAGES: Record<string, SolutionPageData> = {
  'sdr-teams': {
    slug: 'sdr-teams',
    eyebrow: 'SDR Teams',
    title: 'More connects.',
    titleAccent: 'Less admin after every dial.',
    description:
      'GrowthDialer is built for outbound reps who live in the queue: power dial, auto-record, disposition in one click, and HubSpot logging when the call ends.',
    pains: [
      {
        title: 'Queue friction',
        body: 'Reps lose minutes between calls updating CRM fields. Dispositions push to HubSpot automatically with duration and recording link.',
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
      'HubSpot call logging (live integration)',
      'Local presence numbers and spam-score checks',
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
      'Account executives run fewer, higher-stakes calls. GrowthDialer captures the full conversation, flags sentiment shifts, and links insights to the opportunity.',
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
    titleAccent: 'matches your CRM schema.',
    description:
      'RevOps teams need clean call objects, consistent dispositions, and exportable metrics. GrowthDialer writes structured records — not free-text chaos.',
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
        body: 'HubSpot is live today. Salesforce and webhook exports are on the roadmap with a workspace waitlist.',
      },
    ],
    capabilities: [
      'Disposition enum shared across API and UI',
      'Call Logs and Recordings with workspace RLS',
      'Dashboard KPIs and date-range analytics',
      'HubSpot sync for calls and outcomes',
      'CSV lead import with field mapping',
    ],
    outcome:
      'RevOps gets one dialer that respects data hygiene — and a changelog when new CRM connectors ship.',
  },
  agencies: {
    slug: 'agencies',
    eyebrow: 'Agencies',
    title: 'One dialer.',
    titleAccent: 'Separate workspaces per client.',
    description:
      'Agencies running outbound for multiple brands need isolated lead lists, numbers, and reporting — without spinning up a new vendor contract each time.',
    pains: [
      {
        title: 'Client data bleed',
        body: 'Workspace-scoped leads and calls keep Client A separate from Client B at the database level.',
      },
      {
        title: 'Per-seat pricing stacks up',
        body: 'Workspace plans (Starter free, Pro $49, Team $99) scale by team size — not per-client platform fees.',
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
      'Enterprise sales orgs need SSO, custom contracts, dedicated support, and honest answers about what ships today versus roadmap.',
    pains: [
      {
        title: 'Procurement needs facts',
        body: 'We document live features (dialer, recordings, HubSpot) separately from waitlist integrations and coaching bridge work.',
      },
      {
        title: 'Global teams',
        body: 'WebRTC dialing from the browser — no desktop installer. Reps dial from managed laptops with standard headset hardware.',
      },
      {
        title: 'Compliance',
        body: 'Call recording with consent workflows, RLS-isolated workspaces, and webhook-ready event pipeline for your SIEM.',
      },
    ],
    capabilities: [
      'Team and Enterprise workspace tiers',
      'Browser-based voice with purchased local numbers',
      'Monitored production infrastructure with uptime reporting',
      'Custom onboarding and security questionnaire support',
      'API and webhook access (contact sales for SLAs)',
    ],
    outcome:
      'Talk to us about seat volume, CRM requirements, and deployment timeline — we will not oversell what is not live.',
  },
};
