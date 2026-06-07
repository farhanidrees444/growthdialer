import { MetadataRoute } from 'next';
import { MARKETING_ROUTES } from '@/lib/marketing/sitemap-routes';
import { PSEO_COMPETITORS } from '@/lib/marketing/pseo-competitors';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growthdialer.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = MARKETING_ROUTES.map((route) => ({
    url: `${BASE}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const programmaticVsRoutes: MetadataRoute.Sitemap = PSEO_COMPETITORS.map((c) => ({
    url: `${BASE}/vs/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: c.sitemapPriority ?? 0.72,
  }));

  return [...staticRoutes, ...programmaticVsRoutes];
}
