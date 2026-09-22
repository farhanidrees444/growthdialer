import type { ComponentType, SVGProps } from 'react';
import { Users } from 'lucide-react';
import {
  SiSalesforce,
  SiHubspot,
  SiSlack,
  SiZapier,
  SiCalendly,
  SiGooglecalendar,
  SiNotion,
  SiGmail,
  SiPiped,
} from 'react-icons/si';

export type BrandIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type IntegrationBrand = {
  id: string;
  name: string;
  Icon: BrandIcon;
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
    id: 'pipedrive',
    name: 'Pipedrive',
    Icon: SiPiped,
    color: '#017737',
    category: 'crm',
    description: 'Push dispositions and call outcomes into your pipeline automatically.',
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
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    Icon: Users,
    color: '#6264A7',
    category: 'communication',
    description: 'Notify managers when reps book meetings or hit key dispositions.',
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
