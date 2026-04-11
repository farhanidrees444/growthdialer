import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://growthdialer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog/",
          "/compare/",
          "/pricing",
          "/features/",
          "/about",
          "/features/integrations",
          "/contact-sales"
        ],
        disallow: [
          "/dashboard",
          "/dialer",
          "/leads",
          "/sequences",
          "/analytics",
          "/recordings",
          "/settings",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.growthdialer.com/sitemap.xml",
  };
}
