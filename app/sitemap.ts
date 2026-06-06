import { MetadataRoute } from 'next';
import { MARKETING_ROUTES } from '@/lib/marketing/sitemap-routes';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growthdialer.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return MARKETING_ROUTES.map((route) => ({
    url: `${BASE}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
