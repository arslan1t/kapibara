import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "@/lib/storage-polyfill";
import CartHydration from "@/components/layout/CartHydration";
import "./globals.css";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kapibara.ru";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${nunitoSans.variable} ${nunito.variable}`}>
      <body>
        <CartHydration />
        {children}
      </body>
    </html>
  );
}
