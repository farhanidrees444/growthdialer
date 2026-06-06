export type DocSection = {
  id: string;
  title: string;
  description: string;
  href: string;
  topics: string[];
};

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Create a workspace, invite reps, and make your first call in under ten minutes.',
    href: '/docs#getting-started',
    topics: ['Google sign-in', 'Workspace setup', 'Browser mic permissions', 'First outbound dial'],
  },
  {
    id: 'dialer',
    title: 'AI Dialer',
    description: 'Manual dial, power sessions, parallel lines, dispositions, and call controls.',
    href: '/docs#dialer',
    topics: ['Queue tabs', 'Power dial countdown', 'Parallel AMD', 'DTMF keypad', 'Voicemail drop'],
  },
  {
    id: 'leads',
    title: 'Leads & import',
    description: 'CSV import, lead fields, hot/callback queues, and DNC handling.',
    href: '/docs#leads',
    topics: ['CSV column mapping', 'Phone normalization', 'Lead detail timeline', 'Bulk actions'],
  },
  {
    id: 'recordings',
    title: 'Recordings & AI',
    description: 'AI transcription, call summaries, sentiment, and recording library.',
    href: '/docs#recordings',
    topics: ['Auto-record policy', 'AI summary bullets', 'Playback from Call Logs', 'Export links'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'HubSpot OAuth, call logging rules, and waitlist for upcoming connectors.',
    href: '/features/integrations',
    topics: ['HubSpot connect', 'Disposition sync', 'Recording URL on timeline', 'CRM waitlist'],
  },
  {
    id: 'team',
    title: 'Team & workspace',
    description: 'Roles, invites, workspace settings, and number management.',
    href: '/docs#team',
    topics: ['Owner vs agent', 'Invite email flow', 'Caller ID numbers', 'Workspace delete'],
  },
  {
    id: 'api',
    title: 'API reference',
    description: 'REST endpoints for leads, calls, and imports. Webhooks on the roadmap.',
    href: '/docs/api',
    topics: ['Auth cookies', 'GET /api/leads', 'GET /api/calls/logs', 'POST disposition'],
  },
];
