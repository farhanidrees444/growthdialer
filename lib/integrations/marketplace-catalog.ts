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
  configureMode: ConfigureMode | 'vote';
  brandColor: string;
  /** Domain for logo.clearbit.com / logo.dev fetch */
  logoDomain?: string;
  live?: boolean;
  enterprise?: boolean;
  setupSteps: string[];
  fields?: {
    id: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder: string;
    optional?: boolean;
  }[];
  docsUrl?: string;
};

export const MARKETPLACE_CATEGORIES = [
  { id: 'all' as const, label: 'All' },
  { id: 'crm' as const, label: 'CRMs' },
  { id: 'ai_voice' as const, label: 'AI Voice Agents' },
  { id: 'sales_outbound' as const, label: 'Sales Outbound' },
  { id: 'automation' as const, label: 'Automations' },
] as const;

export const WEBHOOK_EVENT_TYPES = [
  'call_completed',
  'call_started',
  'disposition_set',
  'meeting_booked',
] as const;

export const MARKETPLACE_INTEGRATIONS: MarketplaceIntegration[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Log calls, dispositions, and recordings to contact timelines automatically.',
    category: 'crm',
    configureMode: 'oauth',
    brandColor: '#FF7A59',
    logoDomain: 'hubspot.com',
    live: true,
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
    logoDomain: 'salesforce.com',
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
    logoDomain: 'zoho.com',
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
    logoDomain: 'pipedrive.com',
    setupSteps: [
      'Vote to prioritize Pipedrive on our roadmap',
      'Connect via OAuth when available',
      'Map pipeline stages to call outcomes',
    ],
  },
  {
    id: 'attio',
    name: 'Attio',
    description:
      'Modern relationship CRM — sync contacts, notes, and call intelligence in real time.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#FAFAFA',
    logoDomain: 'attio.com',
    setupSteps: [
      'Request early access for Attio sync',
      'Authorize your Attio workspace',
      'Call notes and AI summaries sync to records',
    ],
  },
  {
    id: 'folk',
    name: 'Folk',
    description:
      'Collaborative CRM for teams — push call outcomes and AI briefs to people records.',
    category: 'crm',
    configureMode: 'vote',
    brandColor: '#5B21B6',
    logoDomain: 'folk.app',
    setupSteps: [
      'Request early access for Folk integration',
      'Connect via API key when launched',
      'Map groups and custom fields',
    ],
  },
  {
    id: 'vapi',
    name: 'Vapi',
    description:
      'Orchestrate AI voice agents alongside human reps — handoff context on every transfer.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#FAFAFA',
    logoDomain: 'vapi.ai',
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
    description:
      'Enterprise AI phone agents — sync call transcripts and outcomes to your dialer workspace.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#F97316',
    logoDomain: 'bland.ai',
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
    description:
      'Low-latency voice agents with real-time transcription into GrowthDialer intelligence.',
    category: 'ai_voice',
    configureMode: 'api_key',
    brandColor: '#2563EB',
    logoDomain: 'retellai.com',
    enterprise: true,
    setupSteps: [
      'Copy your Retell API key from Settings → API Keys',
      'Save below — we verify against Retell servers',
      'Agent calls appear in your call log automatically',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'key_...' }],
  },
  {
    id: 'smartlead',
    name: 'Smartlead.ai',
    description:
      'Sync outbound email sequences with call dispositions — close the loop on every lead.',
    category: 'sales_outbound',
    configureMode: 'api_key',
    brandColor: '#059669',
    logoDomain: 'smartlead.ai',
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
    description:
      'Bridge cold email and phone — push meeting-booked and connected dispositions to campaigns.',
    category: 'sales_outbound',
    configureMode: 'api_key',
    brandColor: '#0284C7',
    logoDomain: 'instantly.ai',
    setupSteps: [
      'Generate an Instantly API key in your workspace',
      'Paste below to connect your account',
      'Disposition events update lead tags automatically',
    ],
    fields: [{ id: 'api_key', label: 'API Key', type: 'password', placeholder: 'inst_...' }],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description:
      'Trigger Zaps on call completed, meeting booked, or disposition set — 5,000+ apps.',
    category: 'automation',
    configureMode: 'webhook',
    brandColor: '#FF4A00',
    logoDomain: 'zapier.com',
    live: true,
    setupSteps: [
      'Create a Zap with Webhooks by Zapier → Catch Hook',
      'Copy the custom webhook URL Zapier provides',
      'Paste it below — GrowthDialer POSTs call events to it',
    ],
    fields: [
      {
        id: 'webhook_url',
        label: 'Zapier Catch Hook URL',
        type: 'url',
        placeholder: 'https://hooks.zapier.com/hooks/catch/...',
      },
    ],
    docsUrl: 'https://zapier.com/apps/webhook/integrations',
  },
  {
    id: 'make',
    name: 'Make.com',
    description:
      'Visual automation scenarios — receive signed call events and route to any module.',
    category: 'automation',
    configureMode: 'api_key',
    brandColor: '#6D00CC',
    logoDomain: 'make.com',
    setupSteps: [
      'Create a Custom Webhook module in Make',
      'Copy your Make API token for authenticated scenarios',
      'Save below — events flow into your scenarios',
    ],
    fields: [
      {
        id: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://hook.eu1.make.com/...',
      },
      {
        id: 'api_key',
        label: 'API Token',
        type: 'password',
        placeholder: 'make_...',
        optional: true,
      },
    ],
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Receive signed JSON events at any HTTPS endpoint you control.',
    category: 'automation',
    configureMode: 'webhook',
    brandColor: '#71717A',
    setupSteps: [
      'Deploy an HTTPS endpoint that accepts POST requests',
      'Optionally configure an HMAC signing secret',
      'Save your URL — we deliver call lifecycle events instantly',
    ],
    fields: [
      {
        id: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://api.yourcompany.com/growthdialer',
      },
      {
        id: 'webhook_secret',
        label: 'Signing secret',
        type: 'password',
        placeholder: 'Optional HMAC secret',
        optional: true,
      },
    ],
  },
];

export function getIntegrationById(id: string): MarketplaceIntegration | undefined {
  return MARKETPLACE_INTEGRATIONS.find((i) => i.id === id);
}
