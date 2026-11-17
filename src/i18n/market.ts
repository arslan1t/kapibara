import {
  LANGUAGES,
  LOCALES,
  LOCALE_CONFIG,
  REGIONS,
  REGION_CONFIG,
  type Language,
  type Locale,
  type Region,
  type RegionConfig,
} from "./config";

/**
 * Which country this deployment serves.
 *
 * The two markets are two sites now: capibara.su for Russia, capibara.uz for
 * Uzbekistan. They share a codebase and nothing else — different sellers,
 * different currencies, different law, different payment providers, and
 * databases in different countries, the last of which is what article 27-1 of
 * ЗРУ-547 requires.
 *
 * So the market is a property of the deployment, not of the URL. A visitor to
 * capibara.uz cannot reach a rouble price by editing the path, because the
 * rouble price does not exist on that server.
 *
 * NEXT_PUBLIC_ because the browser needs it too: a price component has to know
 * which currency it is formatting. It is the name of a country, not a secret.
 */
function readMarket(): Region {
  const raw = process.env.NEXT_PUBLIC_MARKET?.trim().toUpperCase();
  if (raw === "UZ" || raw === "RU") return raw;
  // Russia is the default because it is the deployment that already existed;
  // a missing variable must not silently turn the Russian site into an Uzbek
  // one.
  return "RU";
}

export const MARKET: Region = readMarket();

export function marketConfig(): RegionConfig {
  return REGION_CONFIG[MARKET];
}

/** The locales this deployment serves, in the order the switcher lists them. */
export function marketLocales(): Locale[] {
  return REGION_CONFIG[MARKET].locales;
}

export function marketDefaultLocale(): Locale {
  return REGION_CONFIG[MARKET].defaultLocale;
}

// ─── URL segments ─────────────────────────────────────────────────────────────

/**
 * The first path segment is a LANGUAGE, not a locale.
 *
 * The domain already says which country you are in, so repeating it in the
 * path would give capibara.uz/ru-uz/catalog — a URL that states Uzbekistan
 * twice and reads like a bug. /ru and /uz on capibara.uz; /ru on capibara.su.
 *
 * Locale ids are unchanged: "ru-uz" is still what a row in the orders table
 * records, because that value has to stay meaningful when read back from
 * either market's database.
 */
export function localeForLanguage(language: Language): Locale {
  const found = marketLocales().find(
    (locale) => LOCALE_CONFIG[locale].language === language
  );
  return found ?? marketDefaultLocale();
}

export function languageOf(locale: Locale): Language {
  return LOCALE_CONFIG[locale].language;
}

/** The languages this deployment serves, as they appear in a URL. */
export function marketLanguages(): Language[] {
  return marketLocales().map(languageOf);
}

export function isMarketLanguage(value: string): value is Language {
  return (marketLanguages() as readonly string[]).includes(value);
}

/**
 * Narrows a raw route segment to a locale this deployment actually serves.
 *
 * A segment for a language the market does not offer never reaches a page —
 * middleware redirects it and the root layout 404s it — so the fallback here
 * is unreachable in practice and exists so a page can be typed without a cast.
 */
export function localeFromSegment(segment: string): Locale {
  return isMarketLanguage(segment)
    ? localeForLanguage(segment)
    : marketDefaultLocale();
}

/** The segment that addresses a locale on this deployment. */
export function segmentForLocale(locale: Locale): Language {
  return languageOf(locale);
}

/**
 * Narrows a locale read back from the database.
 *
 * Distinct from `localeFromSegment`, which takes a URL segment. A stored value
 * is a full locale id — "ru-uz" — and feeding it to the segment function would
 * silently fall through to this market's default. They look alike at a call
 * site, which is exactly why they are two functions with two names.
 *
 * A row written by the other market (a database restored from the wrong
 * backup, say) resolves to this market's default rather than being honoured:
 * this deployment cannot render Russian prices, so pretending it can would
 * produce a page that is wrong rather than merely mistranslated.
 */
export function localeFromStored(value: string): Locale {
  return (LOCALES as readonly string[]).includes(value) &&
    marketLocales().includes(value as Locale)
    ? (value as Locale)
    : marketDefaultLocale();
}

/**
 * Every language code, for the rare caller that must reason about both markets
 * at once — the sitemap's hreflang set, which points at the other site.
 */
export { LANGUAGES, LOCALES };

// ─── The other site ───────────────────────────────────────────────────────────

/**
 * Where each market lives.
 *
 * Two deployments means two origins, and each needs to know the other's: the
 * hreflang set spans both sites, and the country switcher is a link across
 * domains rather than a route change.
 */
export const SITE_URLS: Record<Region, string> = {
  RU: (process.env.NEXT_PUBLIC_SITE_URL_RU ?? "https://capibara.su").replace(/\/$/, ""),
  UZ: (process.env.NEXT_PUBLIC_SITE_URL_UZ ?? "https://capibara.uz").replace(/\/$/, ""),
};

export function siteUrlFor(region: Region): string {
  return SITE_URLS[region];
}

/** This deployment's own origin. */
export function ownSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? SITE_URLS[MARKET]
  );
}

/**
 * Every (region, locale) pair across both sites, with the absolute URL that
 * serves it. Used for hreflang and for the country switcher.
 */
export function allMarketLocales(): Array<{
  region: Region;
  locale: Locale;
  language: Language;
  href: (path: string) => string;
}> {
  return REGIONS.flatMap((region) =>
    REGION_CONFIG[region].locales.map((locale) => {
      const language = LOCALE_CONFIG[locale].language;
      return {
        region,
        locale,
        language,
        href: (path: string) =>
          `${SITE_URLS[region]}/${language}${path === "/" ? "" : path}`,
      };
    })
  );
}
