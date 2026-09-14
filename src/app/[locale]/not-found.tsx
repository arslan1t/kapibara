import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotFoundContent from "@/components/shared/NotFoundContent";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { asLocale } from "@/i18n/config";
import { LOCALE_HEADER } from "@/middleware";

export const metadata: Metadata = {
  // A 404 is never indexed, so its title is not worth a dynamic render just to
  // translate. The page body below is in the reader's language.
  title: "404",
  robots: { index: false, follow: true },
};

// Root-level boundary for URLs that don't match any route at all — Next.js
// falls back to this (not the (main) group's not-found.tsx) since there's no
// matched layout tree to descend into. Header/Footer are added explicitly
// because the root layout doesn't include them.
export default async function NotFound() {
  const user = await getCurrentUser();
  // Not-found components receive no params, so the locale comes from the
  // header middleware stamped onto the request.
  const locale = asLocale((await headers()).get(LOCALE_HEADER) ?? "");

  return (
    <>
      <Header user={user ? { name: user.name, role: user.role } : null} />
      <main className="min-h-screen">
        <NotFoundContent />
      </main>
      <Footer locale={locale} />
    </>
  );
}
