import type { MetadataRoute } from "next";
import { getPublishedProducts, getAvailableProducts } from "@/lib/products";
import { LOCALE_CONFIG, type Language } from "@/i18n/config";
import {
  allMarketLocales,
  marketLanguages,
  ownSiteUrl,
} from "@/i18n/market";

const baseUrl = ownSiteUrl();

/** Products come from the database, so the sitemap cannot be prerendered. */
export const dynamic = "force-dynamic";

/**
 * Paths worth indexing, with how often each actually changes.
 *
 * Everything private — the cart, the account, a preview of somebody's child —
 * is excluded here and again in robots.ts.
 */
const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/catalog", changeFrequency: "weekly", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/reviews", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/delivery", changeFrequency: "monthly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/personal-data-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/offer", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * The same page in every language it exists in.
 *
 * Search engines need to be told these are translations of one another rather
 * than duplicates — without it the three versions compete with each other, and
 * the one that wins is not necessarily the one in the reader's language.
 */
function alternates(path: string): Record<string, string> {
  // Spans both sites: the markets are separate domains, and a crawler has to
  // be told that capibara.su/ru/catalog and capibara.uz/uz/catalog are the
  // same page in another country's language rather than duplicates.
  return Object.fromEntries(
    allMarketLocales().map((entry) => [
      LOCALE_CONFIG[entry.locale].htmlLang,
      entry.href(path),
    ])
  );
}

function entry(
  language: Language,
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}/${language}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: alternates(path) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Every published book gets a product page; only purchasable ones get a
  // personalization page, because the others cannot be ordered yet.
  const [published, available] = await Promise.all([
    getPublishedProducts(),
    getAvailableProducts(),
  ]);

  return marketLanguages().flatMap((language) => [
    ...STATIC_PATHS.map((route) =>
      entry(language, route.path, now, route.changeFrequency, route.priority)
    ),
    ...published.map((book) =>
      entry(language, `/books/${book.slug}`, now, "weekly", 0.9)
    ),
    ...available.map((book) =>
      entry(language, `/personalize/${book.slug}`, now, "monthly", 0.7)
    ),
  ]);
}
