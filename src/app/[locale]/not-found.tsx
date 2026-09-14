import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotFoundContent from "@/components/shared/NotFoundContent";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

// Root-level boundary for URLs that don't match any route at all — Next.js
// falls back to this (not the (main) group's not-found.tsx) since there's no
// matched layout tree to descend into. Header/Footer are added explicitly
// because the root layout doesn't include them.
export default async function NotFound() {
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user ? { name: user.name, role: user.role } : null} />
      <main className="min-h-screen">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
