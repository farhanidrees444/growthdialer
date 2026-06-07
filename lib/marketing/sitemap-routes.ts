import { MARKETING_SITE } from './navigation';

export type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
};

/** Every public marketing route — keep in sync with app/(marketing) */
export const MARKETING_ROUTES: SitemapEntry[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/demo', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/features/ai', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/integrations', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/features/salesfloor', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact-sales', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/blog/best-ai-sales-dialer-2026', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/blog/how-parallel-dialing-works', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/blog/replace-sdr-team-with-ai', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guides', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/docs', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/docs/api', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/customers', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/changelog', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/roadmap', priority: 0.55, changeFrequency: 'monthly' },
  { path: '/status', priority: 0.4, changeFrequency: 'daily' },
  { path: '/careers', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/press-kit', priority: 0.45, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/solutions/sdr-teams', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/ae-teams', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/revenue-ops', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/agencies', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/solutions/enterprise', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/compare/vs-orum', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-nooks', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-ringdna', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-phoneburner', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-kixie', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-powerdialer', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/compare/vs-krispcall', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/compare/vs-dandydialer', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/compare/vs-readymode', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/compare/vs-ringcentral', priority: 0.7, changeFrequency: 'monthly' },
];

export function marketingUrl(path: string) {
  return `${MARKETING_SITE}${path === '/' ? '' : path}`;
}
