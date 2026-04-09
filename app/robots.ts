import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://growthdialer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/dialer", "/contacts", "/settings", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
