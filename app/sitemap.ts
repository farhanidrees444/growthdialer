import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://growthdialer.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { url: BASE, priority: 1 },
    { url: `${BASE}/features`, priority: 0.9 },
    { url: `${BASE}/pricing`, priority: 0.9 },
    { url: `${BASE}/integrations`, priority: 0.8 },
    { url: `${BASE}/blog`, priority: 0.7 },
    { url: `${BASE}/login`, priority: 0.5 },
    { url: `${BASE}/signup`, priority: 0.6 },
  ];

  return pages.map((p) => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p.priority,
  }));
}
