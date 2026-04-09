import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://growthdialer.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{
    url: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }> = [
    { url: BASE, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/pricing`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/blog`, priority: 0.6, changeFrequency: "daily" },
    { url: `${BASE}/blog/best-b2b-sales-dialer-2026`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/blog/parallel-dialing-guide`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/blog/ai-coaching`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/features/ai-voice`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-krispcall`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-dandydialer`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-powerdialer`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-orum`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-nooks`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/compare/vs-phoneburner`, priority: 0.8, changeFrequency: "monthly" },
  ];

  return pages.map((p) => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
