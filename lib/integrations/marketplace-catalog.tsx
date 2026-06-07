import type { ReactNode } from 'react';

export type MarketplaceAction = 'connect' | 'configure' | 'vote';

export type MarketplaceIntegration = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'crm' | 'automation' | 'communication' | 'productivity';
  action: MarketplaceAction;
  brandColor: string;
  popular?: boolean;
  live?: boolean;
  logo: ReactNode;
};

function HubSpotLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path
        d="M18.164 7.931V5.862a1.56 1.56 0 0 0 .9-1.41V4.41a1.56 1.56 0 0 0-1.56-1.56h-.042a1.56 1.56 0 0 0-1.56 1.56v.042a1.56 1.56 0 0 0 .9 1.41v2.069A6.51 6.51 0 0 0 13.66 9.27L7.11 4.1a1.73 1.73 0 0 0 .05-.38 1.73 1.73 0 1 0-1.73 1.73 1.71 1.71 0 0 0 .9-.26l6.42 5.06a6.51 6.51 0 0 0-.85 3.21 6.51 6.51 0 0 0 .95 3.38l-1.95 1.95a1.4 1.4 0 0 0-.4-.06 1.46 1.46 0 1 0 1.46 1.46 1.4 1.4 0 0 0-.06-.4l1.92-1.92a6.53 6.53 0 1 0 5.34-9.94zm-.7 9.93a3.52 3.52 0 1 1 0-7.04 3.52 3.52 0 0 1 0 7.04z"
        fill="#FF7A59"
      />
    </svg>
  );
}

function SalesforceLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path
        d="M10.12 4.64a4.26 4.26 0 0 1 3.07-1.3 4.3 4.3 0 0 1 3.62 1.97 3.27 3.27 0 0 1 1.47-.35 3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-.43 1.64 2.97 2.97 0 0 1 .75 1.98 2.97 2.97 0 0 1-2.97 2.97h-.12a2.43 2.43 0 0 1-2.38 1.93 2.43 2.43 0 0 1-1.07-.25 3.64 3.64 0 0 1-3.46 2.49 3.64 3.64 0 0 1-3.37-2.27A2.73 2.73 0 0 1 3.3 14.4a2.73 2.73 0 0 1 .56-1.66 3.16 3.16 0 0 1-.6-1.87 3.16 3.16 0 0 1 3.16-3.16c.22 0 .44.02.65.06a4.26 4.26 0 0 1 3.05-3.13z"
        fill="#00A1E0"
      />
    </svg>
  );
}

function ZohoLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#E42527" />
      <path d="M7 8h10v1.8H9.4v2.2H15v1.8H9.4V16H7V8z" fill="white" />
    </svg>
  );
}

function PipedriveLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#1A1A1A" />
      <circle cx="12" cy="12" r="4" fill="#25C16F" />
    </svg>
  );
}

function ZapierLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#FF4A00" />
      <path d="M13.5 6l-3 6h3l-3 6 7.5-7.5H14l3-4.5H13.5z" fill="white" />
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A" />
      <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0" />
      <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D" />
      <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E" />
      <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#FFFFFF" />
      <path
        d="M6.5 5.5h11l-1 12.5-4.5 1.5-4.5-1.5L6.5 5.5zm2.2 2.2v8.6l2.3.8V7.7H8.7zm4.6 0v9.4l2.3-.8V7.7h-2.3z"
        fill="#000000"
      />
    </svg>
  );
}

function WebhookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden fill="none">
      <rect width="24" height="24" rx="6" fill="#18181B" stroke="#3F3F46" />
      <path d="M8 12h8M12 8v8" stroke="#A78BFA" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1.5" fill="#06B6D4" />
      <circle cx="17" cy="12" r="1.5" fill="#06B6D4" />
      <circle cx="12" cy="7" r="1.5" fill="#06B6D4" />
      <circle cx="12" cy="17" r="1.5" fill="#06B6D4" />
    </svg>
  );
}

export const MARKETPLACE_INTEGRATIONS: MarketplaceIntegration[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    tagline: 'CRM sync',
    description: 'Log calls, dispositions, and recordings to contact timelines automatically.',
    category: 'crm',
    action: 'connect',
    brandColor: '#FF7A59',
    popular: true,
    live: true,
    logo: <HubSpotLogo />,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    tagline: 'Enterprise CRM',
    description: 'Bi-directional activity logging for opportunities, contacts, and custom objects.',
    category: 'crm',
    action: 'vote',
    brandColor: '#00A1E0',
    popular: true,
    logo: <SalesforceLogo />,
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    tagline: 'CRM suite',
    description: 'Sync leads and call outcomes into Zoho pipelines and deal stages.',
    category: 'crm',
    action: 'vote',
    brandColor: '#E42527',
    logo: <ZohoLogo />,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    tagline: 'Pipeline CRM',
    description: 'Push dispositions to deals and auto-log every dial to your pipeline.',
    category: 'crm',
    action: 'vote',
    brandColor: '#25C16F',
    logo: <PipedriveLogo />,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    tagline: '5,000+ apps',
    description: 'Trigger Zaps on call completed, meeting booked, or disposition set.',
    category: 'automation',
    action: 'configure',
    brandColor: '#FF4A00',
    popular: true,
    logo: <ZapierLogo />,
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    tagline: 'Your stack',
    description: 'Receive signed JSON events at any HTTPS endpoint you control.',
    category: 'automation',
    action: 'configure',
    brandColor: '#A78BFA',
    logo: <WebhookLogo />,
  },
  {
    id: 'slack',
    name: 'Slack',
    tagline: 'Team alerts',
    description: 'Notify channels when reps connect, book meetings, or hit key dispositions.',
    category: 'communication',
    action: 'vote',
    brandColor: '#ECB22E',
    popular: true,
    logo: <SlackLogo />,
  },
  {
    id: 'notion',
    name: 'Notion',
    tagline: 'Knowledge base',
    description: 'Push AI summaries and call notes into your Notion workspace.',
    category: 'productivity',
    action: 'vote',
    brandColor: '#FFFFFF',
    logo: <NotionLogo />,
  },
];

export const MARKETPLACE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'crm', label: 'CRM' },
  { id: 'automation', label: 'Automation' },
  { id: 'communication', label: 'Communication' },
  { id: 'productivity', label: 'Productivity' },
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number]['id'];

export const WEBHOOK_EVENT_TYPES = [
  'call_completed',
  'call_started',
  'disposition_set',
  'meeting_booked',
] as const;
