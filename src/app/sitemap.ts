import type { MetadataRoute } from "next";
import { getPublishedProducts, getAvailableProducts } from "@/lib/products";

import { SITE_URL_FALLBACK } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL_FALLBACK;

/** Products come from the database, so the sitemap cannot be prerendered. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/catalog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/personal-data-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/offer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Every published book gets a product page; only purchasable ones get a
  // personalization page, because the others cannot be ordered yet.
  const [published, available] = await Promise.all([
    getPublishedProducts(),
    getAvailableProducts(),
  ]);

  const bookRoutes: MetadataRoute.Sitemap = published.map((b) => ({
    url: `${baseUrl}/books/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const personalizeRoutes: MetadataRoute.Sitemap = available.map((b) => ({
    url: `${baseUrl}/personalize/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...bookRoutes, ...personalizeRoutes];
}
