/**
 * Single source of truth for marketing site navigation.
 * Used by live-floor Nav, SiteFooter, and sitemap generation.
 */

export type NavLink = { label: string; href: string; external?: boolean };
export type NavItem = NavLink & { children?: NavLink[] };

export const APP_SIGNIN = 'https://app.growthdialer.com/login';
export const APP_SIGNUP = 'https://app.growthdialer.com/signup';
export const MARKETING_SITE = 'https://growthdialer.com';
/** Public status page — always internal, never third-party vendor dashboards */
export const STATUS_URL = '/status';

/** Top nav — full legacy IA + current product pages */
export const TOP_NAV: NavItem[] = [
  {
    label: 'Features',
    href: '/features',
    children: [
      { label: 'All features', href: '/features' },
      { label: 'AI intelligence', href: '/features/ai' },
      { label: 'Integrations', href: '/features/integrations' },
      { label: 'Live salesfloor', href: '/features/salesfloor' },
    ],
  },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  {
    label: 'Resources',
    href: '/docs',
    children: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Case studies', href: '/customers' },
      { label: 'Guides', href: '/guides' },
      { label: 'API reference', href: '/docs/api' },
      { label: 'Status', href: '/status' },
    ],
  },
];

export type FooterColumn = { heading: string; links: NavLink[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/features/integrations' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'SDR teams', href: '/solutions/sdr-teams' },
      { label: 'AE teams', href: '/solutions/ae-teams' },
      { label: 'Revenue ops', href: '/solutions/revenue-ops' },
      { label: 'Agencies', href: '/solutions/agencies' },
      { label: 'Enterprise', href: '/solutions/enterprise' },
    ],
  },
  {
    heading: 'Compare',
    links: [
      { label: 'vs Orum', href: '/compare/vs-orum' },
      { label: 'vs Nooks', href: '/compare/vs-nooks' },
      { label: 'vs RingDNA', href: '/compare/vs-ringdna' },
      { label: 'vs PhoneBurner', href: '/compare/vs-phoneburner' },
      { label: 'vs Kixie', href: '/compare/vs-kixie' },
      { label: 'vs PowerDialer', href: '/compare/vs-powerdialer' },
      { label: 'vs KrispCall', href: '/compare/vs-krispcall' },
      { label: 'vs DandyDialer', href: '/compare/vs-dandydialer' },
      { label: 'vs ReadyMode', href: '/compare/vs-readymode' },
      { label: 'vs RingCentral', href: '/compare/vs-ringcentral' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Case studies', href: '/customers' },
      { label: 'Guides', href: '/guides' },
      { label: 'API reference', href: '/docs/api' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press kit', href: '/press-kit' },
      { label: 'Contact sales', href: '/contact-sales' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
    ],
  },
];

export const SOCIAL_LINKS: NavLink[] = [
  { label: 'X (Twitter)', href: 'https://twitter.com/growthdialer', external: true },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/growthdialer', external: true },
  { label: 'GitHub', href: 'https://github.com/growthdialer', external: true },
  { label: 'YouTube', href: 'https://youtube.com/@growthdialer', external: true },
];
