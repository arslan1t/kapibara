import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth";
import { type LangParams } from "@/i18n/config";
import { localeFromSegment } from "@/i18n/market";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LangParams>;
}) {
  const locale = localeFromSegment((await params).lang);
  // Read on the server so the header renders in the correct state on first
  // paint, with no signed-out flash.
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user ? { name: user.name, role: user.role } : null} />
      <main className="min-h-screen">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
