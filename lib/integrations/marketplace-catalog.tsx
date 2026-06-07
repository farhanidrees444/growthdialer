import type { ReactNode } from 'react';

export type MarketplaceCategory =
  | 'all'
  | 'crm'
  | 'ai_voice'
  | 'sales_outbound'
  | 'automation';

export type ConfigureMode = 'webhook' | 'api_key' | 'oauth';

export type IntegrationBadge = 'connected' | 'configure' | 'enterprise' | 'early_access';

export type MarketplaceIntegration = {
  id: string;
  name: string;
  description: string;
  category: Exclude<MarketplaceCategory, 'all'>;
  /** How the user connects this integration */
  configureMode: ConfigureMode | 'vote';
  brandColor: string;
  logo: ReactNode;
  /** Live OAuth or webhook pipeline */
  live?: boolean;
  /** Requires enterprise plan — shows premium badge */
  enterprise?: boolean;
  /** Setup checklist shown in configure modal */
  setupSteps: string[];
  /** Form fields for configure modal */
  fields?: { id: string; label: string; type: 'text' | 'password' | 'url'; placeholder: string; optional?: boolean }[];
  docsUrl?: string;
};

// ─── Brand logos (minimal SVG placeholders) ─────────────────────────────────

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

function AttioLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
      <path d="M8 16V8l4 4 4-4v8" stroke="#FAFAFA" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolkLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#5B21B6" />
      <circle cx="9" cy="10" r="2.5" fill="white" />
      <circle cx="15" cy="10" r="2.5" fill="white" />
      <path d="M7 16c1.2-2 2.8-3 5-3s3.8 1 5 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function VapiLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#09090B" stroke="#27272A" />
      <path d="M7 8h4l3 8 3-8h4" stroke="#FAFAFA" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BlandLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#F97316" />
      <path d="M8 16V8h3.5a3 3 0 0 1 0 6H8" stroke="white" strokeWidth="1.75" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function RetellLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#2563EB" />
      <path d="M8 8h8M8 12h5M8 16h8" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SmartleadLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#059669" />
      <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function InstantlyLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0284C7" />
      <path d="M8 16l8-8M10 8h6v6" stroke="white" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

function MakeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#6D00CC" />
      <circle cx="8" cy="12" r="2" fill="white" />
      <circle cx="16" cy="8" r="2" fill="white" />
      <circle cx="16" cy="16" r="2" fill="white" />
      <path d="M10 12h4M14 10l2-2M14 14l2 2" stroke="white" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function WebhookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden fill="none">
      <rect width="24" height="24" rx="6" fill="#18181B" stroke="#3F3F46" />
      <path d="M8 12h8M12 8v8" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1.5" fill="#71717A" />
      <circle cx="17" cy="12" r="1.5" fill="#71717A" />
    </svg>
  );
}

export const MARKETPLACE_CATEGORIES = [
  { id: 'all' as const, label: 'All' },
  { id: 'crm' as const, label: 'CRMs' },
  { id: 'ai_voice' as const, label: 'AI Voice Agents' },
  { id: 'sales_outbound' as const, label: 'Sales Outbound' },
  { id: 'automation' as const, label: 'Automations' },
];

export const WEBHOOK_EVENT_TYPES = [
  'call_completed',
  'call_started',
  'disposition_set',
  'meeting_booked',
] as const;

export const MARKETPLACE_INTEGRATIONS: MarketplaceIntegration[] = [
  // ─── CRMs ─────────────────────────────────────────────────────────────────
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Log calls, dispositions, and recordings to contact timelines automatically.',
    category: 'crm',
    configureMode: 'oauth',
    brandColor: '#FF7A59',
    live: true,
    logo: <HubSpotLogo />,
    setupSteps: [
      'Authorize GrowthDialer in your HubSpot account',
      'Select the portal you want to sync',
      'Calls log automatically after disposition',
    ],
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Bi-directional activity logging for opportunities, contacts, and custom objects.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#00A1E0',
    enterprise: true,
    setupSteps: [
      'Request early access for your workspace',
      'Our team provisions Salesforce Connected App credentials',
      'Map custom objects and activity fields',
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync leads and call outcomes into Zoho pipelines and deal stages.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#E42527',
    enterprise: true,
    setupSteps: [
      'Join the Zoho integration waitlist',
      'Receive OAuth credentials from our team',
      'Map deal stages to dispositions',
    ],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Push dispositions to deals and auto-log every dial to your pipeline.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#25C16F',
    setupSteps: [
      'Vote to prioritize Pipedrive on our roadmap',
      'Connect via OAuth when available',
      'Map pipeline stages to call outcomes',
    ],
  },
  {
    id: 'attio',
    name: 'Attio',
    description: 'Modern relationship CRM — sync contacts, notes, and call intelligence in real time.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#FAFAFA',
    setupSteps: [
      'Request early access for Attio sync',
      'Authorize your Attio workspace',
      'Call notes and AI summaries sync to records',
    ],
  },
  {
    id: 'folk',
    name: 'Folk',
    description: 'Collaborative CRM for teams — push call outcomes and AI briefs to people records.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#5B21B6',
    setupSteps: [
      'Request early access for Folk integration',
      'Connect via API key when launched',
      'Map groups and custom fields',
    ],
  },
  // ─── AI Voice Agents ────────────────────────────────────────────────────────
  {
    id: 'vapi',
    name: 'Vapi',
    description: 'Orchestrate AI voice agents alongside human reps — handoff context on every transfer.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#FAFAFA',
    enterprise: true,
    setupSteps: [
      'Copy your Vapi private API key from the dashboard',
      'Paste it below — we validate the connection live',
      'Route inbound AI calls into GrowthDialer disposition flow',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'vapi_...' }],
  },
  {
    id: 'bland',
    name: 'Bland AI',
    description: 'Enterprise AI phone agents — sync call transcripts and outcomes to your dialer workspace.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#F97316',
    enterprise: true,
    setupSteps: [
      'Generate an API key in Bland AI dashboard',
      'Enter the key below to authenticate',
      'Transcripts and dispositions sync on call end',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-...' }],
  },
  {
    id: 'retell',
    name: 'Retell AI',
    description: 'Low-latency voice agents with real-time transcription into GrowthDialer intelligence.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#2563EB',
    enterprise: true,
    setupSteps: [
      'Copy your Retell API key from Settings → API Keys',
      'Save below — we verify against Retell servers',
      'Agent calls appear in your call log automatically',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'key_...' }],
  },
  // ─── Sales Outbound ─────────────────────────────────────────────────────────
  {
    id: 'smartlead',
    name: 'Smartlead.ai',
    description: 'Sync outbound email sequences with call dispositions — close the loop on every lead.',
    category: 'sales_outbound',
    configureMode: 'api_key',
    brandColor: '#059669',
    setupSteps: [
      'Copy your Smartlead API key from Settings',
      'Authenticate below — we test the connection live',
      'Call outcomes update lead status in Smartlead',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'sl_...' }],
  },
  {
    id: 'instantly',
    name: 'Instantly.ai',
    description: 'Bridge cold email and phone — push meeting-booked and connected dispositions to campaigns.',
    category: 'sales_outbound',
    configureMode: 'api_key',
    brandColor: '#0284C7',
    setupSteps: [
      'Generate an Instantly API key in your workspace',
      'Paste below to connect your account',
      'Disposition events update lead tags automatically',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'inst_...' }],
  },
  // ─── Automations ────────────────────────────────────────────────────────────
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Trigger Zaps on call completed, meeting booked, or disposition set — 5,000+ apps.',
    category: 'automation',
    configureMode: 'webhook',
    brandColor: '#FF4A00',
    live: true,
    setupSteps: [
      'Create a Zap with Webhooks by Zapier → Catch Hook',
      'Copy the custom webhook URL Zapier provides',
      'Paste it below — GrowthDialer POSTs call events to it',
    ],
    fields: [{ id: 'webhook_url', label: 'Zapier Catch Hook URL', type: 'url', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }],
    docsUrl: 'https://zapier.com/apps/webhook/integrations',
  },
  {
    id: 'make',
    name: 'Make.com',
    description: 'Visual automation scenarios — receive signed call events and route to any module.',
    category: 'automation',
    configureMode: 'api_key',
    brandColor: '#6D00CC',
    setupSteps: [
      'Create a Custom Webhook module in Make',
      'Copy your Make API token for authenticated scenarios',
      'Save below — events flow into your scenarios',
    ],
    fields: [
      { id: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://hook.eu1.make.com/...' },
      { id: 'api_key', label: 'API Token', type: 'password', placeholder: 'make_...', optional: true },
    ],
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Receive signed JSON events at any HTTPS endpoint you control.',
    category: 'automation',
    configureMode: 'webhook',
    brandColor: '#71717A',
    live: true,
    setupSteps: [
      'Deploy an HTTPS endpoint that accepts POST requests',
      'Optionally configure an HMAC signing secret',
      'Save your URL — we deliver call lifecycle events instantly',
    ],
    fields: [
      { id: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://api.yourcompany.com/growthdialer' },
      { id: 'webhook_secret', label: 'Signing secret', type: 'password', placeholder: 'Optional HMAC secret', optional: true },
    ],
  },
].map((item) => ({
  ...item,
  logo:
    item.logo ??
    {
      hubspot: <HubSpotLogo />,
      salesforce: <SalesforceLogo />,
      zoho: <ZohoLogo />,
      pipedrive: <PipedriveLogo />,
      attio: <AttioLogo />,
      folk: <FolkLogo />,
      vapi: <VapiLogo />,
      bland: <BlandLogo />,
      retell: <RetellLogo />,
      smartlead: <SmartleadLogo />,
      instantly: <InstantlyLogo />,
      zapier: <ZapierLogo />,
      make: <MakeLogo />,
      webhooks: <WebhookLogo />,
    }[item.id],
})) as MarketplaceIntegration[];

export function getIntegrationById(id: string): MarketplaceIntegration | undefined {
  return MARKETPLACE_INTEGRATIONS.find((i) => i.id === id);
}
