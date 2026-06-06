import type { IconType } from 'react-icons';
import {
  SiSalesforce,
  SiHubspot,
  SiSlack,
  SiZapier,
  SiCalendly,
  SiGooglecalendar,
  SiNotion,
  SiGmail,
  SiTwilio,
  SiStripe,
} from 'react-icons/si';

export type IntegrationBrand = {
  id: string;
  name: string;
  Icon: IconType;
  color: string;
  category: 'crm' | 'communication' | 'automation' | 'calendar' | 'productivity';
  live?: boolean;
  description: string;
};

/** Real brand marks for marketing — HubSpot is live in product today. */
export const INTEGRATION_BRANDS: IntegrationBrand[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    Icon: SiHubspot,
    color: '#FF7A59',
    category: 'crm',
    live: true,
    description: 'Log calls, dispositions, and recordings to contact timelines after every dial.',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    Icon: SiSalesforce,
    color: '#00A1E0',
    category: 'crm',
    description: 'Bi-directional activity logging for opportunities and contacts.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    Icon: SiTwilio,
    color: '#F22F46',
    category: 'crm',
    description: 'Carrier-grade voice infrastructure behind every dial.',
  },
  {
    id: 'slack',
    name: 'Slack',
    Icon: SiSlack,
    color: '#36C5F0',
    category: 'communication',
    description: 'Alerts when reps connect, book meetings, or hit DNC.',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    Icon: SiGmail,
    color: '#EA4335',
    category: 'communication',
    description: 'Trigger follow-up email after disposition.',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    Icon: SiZapier,
    color: '#FF4F00',
    category: 'automation',
    description: 'Connect to 5,000+ apps on call ended or meeting booked.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    Icon: SiStripe,
    color: '#635BFF',
    category: 'automation',
    description: 'Workspace billing and seat management for growing teams.',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    Icon: SiCalendly,
    color: '#006BFF',
    category: 'calendar',
    description: 'Book meetings straight from call outcomes.',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    Icon: SiGooglecalendar,
    color: '#4285F4',
    category: 'calendar',
    description: 'Sync booked meetings to your calendar.',
  },
  {
    id: 'notion',
    name: 'Notion',
    Icon: SiNotion,
    color: '#FFFFFF',
    category: 'productivity',
    description: 'Push AI summaries and notes to your workspace.',
  },
];
