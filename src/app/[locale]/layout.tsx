import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import "@/lib/storage-polyfill";
import { LOCALES, LOCALE_CONFIG, isLocale } from "@/i18n/config";
import { SITE_URL_FALLBACK } from "@/lib/constants";
import { getDictionary } from "@/i18n/dictionary";
import { DictionaryProvider } from "@/i18n/DictionaryProvider";
import CartHydration from "@/components/layout/CartHydration";
import CookieConsent from "@/components/legal/CookieConsent";
import "../globals.css";

// Warm rounded display for headings; rounded, highly readable sans for body.
// Both carry full Cyrillic coverage.
const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL_FALLBACK;

/**
 * One static page per locale, built at deploy time.
 *
 * Without this the locale segment forces every page dynamic, and a catalogue
 * that changes a few times a month would be re-rendered on every request in
 * three languages.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Per-locale metadata, including the hreflang set.
 *
 * Without `alternates.languages` the three versions of every page compete with
 * one another in search results as duplicates, and the one that wins is not
 * necessarily the one in the reader's language.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = getDictionary(locale);
  const config = LOCALE_CONFIG[locale];

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.titleDefault, template: t.meta.titleTemplate },
    description: t.meta.description,
    keywords: [
      t.meta.keyword1,
      t.meta.keyword2,
      t.meta.keyword3,
      t.meta.keyword4,
      t.meta.keyword5,
    ],
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: Object.fromEntries(
        LOCALES.map((other) => [
          LOCALE_CONFIG[other].htmlLang,
          `${siteUrl}/${other}`,
        ])
      ),
    },
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      type: "website",
      locale: config.ogLocale,
      siteName: t.meta.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={LOCALE_CONFIG[locale].htmlLang}
      className={`${nunitoSans.variable} ${nunito.variable}`}
    >
      <body>
        <DictionaryProvider dictionary={dictionary}>
          <CartHydration />
          {children}
          {/* Root layout, not (main): the banner must also appear on the
              sign-in and registration pages, which live in their own route
              group. */}
          <CookieConsent />
        </DictionaryProvider>
      </body>
    </html>
  );
}
