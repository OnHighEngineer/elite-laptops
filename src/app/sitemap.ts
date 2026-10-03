import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.elitelaptops.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const laptops = await getCatalog();
  const pages = ["", "/shop", "/contact", "/about", "/warranty", "/exchange", "/shipping", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${BASE}${p}` })),
    ...laptops.map((p) => ({ url: `${BASE}/shop/${p.id}` })),
  ];
}
