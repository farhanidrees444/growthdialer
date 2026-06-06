export type ChangelogEntry = {
  date: string;
  version: string;
  title: string;
  summary: string;
  tags: ('feature' | 'fix' | 'integration' | 'infra')[];
  items: string[];
};

/** Shipped updates — aligned with product truth in roadmap */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-05-28',
    version: '0.9.0',
    title: 'Call Logs hub + inbound history',
    summary: 'Full call history with filters, stats, and inbound panel in settings.',
    tags: ['feature'],
    items: [
      'Call Logs page with inbound/outbound filters and daily connect stats',
      'Inbound call history panel in Settings → Calling',
      'Sidebar badge for total workspace calls',
    ],
  },
  {
    date: '2026-05-20',
    version: '0.8.5',
    title: 'Parallel dialer — AMD + VM drop',
    summary: 'Parallel sessions with answering-machine detection and auto voicemail on losers.',
    tags: ['feature'],
    items: [
      '2–10 line parallel dial with live leg grid',
      'AMD webhook skips machines; auto VM drop on non-winner lines',
      'Realtime leg status in the parallel dialer',
    ],
  },
  {
    date: '2026-05-12',
    version: '0.8.0',
    title: 'HubSpot integration live',
    summary: 'OAuth connect and automatic call logging on disposition.',
    tags: ['integration'],
    items: [
      'HubSpot OAuth from workspace Integrations tab',
      'Call duration, disposition, and recording link on contact timeline',
      'Integration waitlist for Salesforce and Slack',
    ],
  },
  {
    date: '2026-05-01',
    version: '0.7.0',
    title: 'Sequences MVP + custom dispositions',
    summary: 'Multi-step cadences and workspace-specific disposition labels.',
    tags: ['feature'],
    items: [
      'Sequence builder with call and wait steps',
      'Lead enrollment from Sequences page',
      'Custom disposition types in Settings',
    ],
  },
  {
    date: '2026-04-18',
    version: '0.6.0',
    title: 'Power dialer + AI briefs',
    summary: 'Session-based auto-dial with countdown and pre-call AI context.',
    tags: ['feature'],
    items: [
      'Power dial sessions with pause, skip, and queue remaining',
      'AI brief panel before each connect',
      'Eight default dispositions with callback scheduling',
    ],
  },
  {
    date: '2026-04-01',
    version: '0.5.0',
    title: 'Workspaces + team roles',
    summary: 'Multi-tenant workspaces with owner, admin, manager, and agent roles.',
    tags: ['infra'],
    items: [
      'Workspace setup flow after Google sign-in',
      'Team invites and member management',
      'Row-level security per workspace',
    ],
  },
];
