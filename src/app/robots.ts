import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.elitelaptops.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/orders", "/api/", "/auth/"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
