import { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growthdialer.com';

/** App routes that must not be indexed */
const DISALLOW = [
  '/dashboard',
  '/dialer',
  '/leads',
  '/sequences',
  '/analytics',
  '/recordings',
  '/call-logs',
  '/numbers',
  '/integrations',
  '/settings',
  '/team',
  '/coaching',
  '/leaderboard',
  '/login',
  '/signup',
  '/workspace',
  '/accept-invite',
  '/api/',
  '/auth/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOW,
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
