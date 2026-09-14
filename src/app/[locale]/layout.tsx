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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Капибара — Персонализированные детские книги",
    template: "%s | Капибара",
  },
  description:
    "Создайте уникальную книгу, в которой главным героем станет ваш ребёнок. Вплетите его имя и фото в волшебную историю!",
  keywords: [
    "персонализированные книги",
    "детские книги с именем",
    "книга с фото ребёнка",
    "подарок ребёнку",
    "именная книга",
  ],
  openGraph: {
    title: "Капибара — Персонализированные детские книги",
    description: "Уникальные книги, где главный герой — ваш ребёнок!",
    type: "website",
    locale: "ru_RU",
    siteName: "Капибара",
  },
  twitter: {
    card: "summary_large_image",
    title: "Капибара — Персонализированные детские книги",
    description: "Уникальные книги, где главный герой — ваш ребёнок!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
