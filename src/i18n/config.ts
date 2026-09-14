/**
 * Markets and languages the storefront serves.
 *
 * Two things vary independently and must not be conflated:
 *
 *   • the REGION decides what is true — which currency the price is in, who
 *     the seller is, what the delivery options are, which law the documents
 *     are written under;
 *   • the LANGUAGE decides only how it is worded.
 *
 * Uzbekistan is served in two languages, Russia in one, so a locale is the
 * pair. Keeping them as one flat union means a route parameter fully
 * determines both, with nothing to infer at render time.
 */

export const LOCALES = ["ru", "ru-uz", "uz"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Russia keeps the bare paths it already has. Changing that would break every
 * link that exists in the wild for the sake of symmetry.
 */
export const DEFAULT_LOCALE: Locale = "ru";

export const REGIONS = ["RU", "UZ"] as const;
export type Region = (typeof REGIONS)[number];

export const LANGUAGES = ["ru", "uz"] as const;
export type Language = (typeof LANGUAGES)[number];

export interface LocaleConfig {
  locale: Locale;
  region: Region;
  language: Language;
  /** The <html lang> attribute, and the tag Intl formats dates with. */
  htmlLang: string;
  /** og:locale. */
  ogLocale: string;
  /** This language's own name, for the switcher. Never translated. */
  languageLabel: string;
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  ru: {
    locale: "ru",
    region: "RU",
    language: "ru",
    htmlLang: "ru-RU",
    ogLocale: "ru_RU",
    languageLabel: "Русский",
  },
  "ru-uz": {
    locale: "ru-uz",
    region: "UZ",
    language: "ru",
    htmlLang: "ru-UZ",
    ogLocale: "ru_UZ",
    languageLabel: "Русский",
  },
  uz: {
    locale: "uz",
    region: "UZ",
    language: "uz",
    htmlLang: "uz-UZ",
    ogLocale: "uz_UZ",
    languageLabel: "Oʻzbekcha",
  },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// ─── Regions ──────────────────────────────────────────────────────────────────

export type CurrencyCode = "RUB" | "UZS";

export interface RegionConfig {
  region: Region;
  /** ISO 3166-1 alpha-2, for schema.org and address forms. */
  countryCode: "RU" | "UZ";
  currency: CurrencyCode;
  /**
   * Column on Product this region's price lives in. Russia was here first and
   * keeps `price`; a second column beats a prices table while there are two
   * markets, and the admin form stays something a person can read.
   */
  priceField: "price" | "priceUzs";
  oldPriceField: "oldPrice" | "oldPriceUzs";
  /** Locales offered here, in the order the switcher lists them. */
  locales: Locale[];
  defaultLocale: Locale;
  /** Delivery methods that actually exist in this country. */
  deliveryMethods: readonly string[];
  /** International dialling prefix, and the shape a local number takes. */
  phone: { prefix: string; digits: number; example: string };
  /** IANA zone used when a date has to be shown in local time. */
  timeZone: string;
}

export const REGION_CONFIG: Record<Region, RegionConfig> = {
  RU: {
    region: "RU",
    countryCode: "RU",
    currency: "RUB",
    priceField: "price",
    oldPriceField: "oldPrice",
    locales: ["ru"],
    defaultLocale: "ru",
    deliveryMethods: ["courier", "pickup_point", "post"],
    phone: { prefix: "+7", digits: 10, example: "+7 (900) 000-00-00" },
    timeZone: "Europe/Moscow",
  },
  UZ: {
    region: "UZ",
    countryCode: "UZ",
    currency: "UZS",
    priceField: "priceUzs",
    oldPriceField: "oldPriceUzs",
    // Russian first: it is what most of the audience reads today, and the
    // switcher should open on the option most people want.
    locales: ["ru-uz", "uz"],
    defaultLocale: "ru-uz",
    // Courier inside Tashkent, post to the rest of the country. No pickup
    // points: we have none there, and offering one we cannot honour is worse
    // than offering two we can.
    deliveryMethods: ["courier", "post"],
    phone: { prefix: "+998", digits: 9, example: "+998 90 000 00 00" },
    timeZone: "Asia/Tashkent",
  },
};

export function regionOf(locale: Locale): Region {
  return LOCALE_CONFIG[locale].region;
}

export function configOf(locale: Locale): LocaleConfig & { regionConfig: RegionConfig } {
  const config = LOCALE_CONFIG[locale];
  return { ...config, regionConfig: REGION_CONFIG[config.region] };
}

// ─── Paths ────────────────────────────────────────────────────────────────────

/**
 * Prefixes a path with the locale segment.
 *
 * Every internal link goes through this. A hardcoded "/catalog" works by
 * accident on the Russian site and silently throws the visitor out of the
 * Uzbek one, which is the kind of bug that is invisible until someone in
 * Tashkent loses their cart.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/** Strips a leading locale segment, returning the path as the app knows it. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
  }
  return { locale: null, path: pathname };
}

/**
 * Narrows the raw route parameter to a Locale.
 *
 * Next types a dynamic segment as `string`, so every page receives one. The
 * root layout has already rejected anything that is not a locale with a 404 by
 * the time a page renders, which makes the fallback here unreachable in
 * practice — it exists so that a page can be typed without a cast.
 */
export function asLocale(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The shape every route under [locale] receives. */
export type LocaleParams = { locale: string };
