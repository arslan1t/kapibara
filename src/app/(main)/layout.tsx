import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server so the header renders in the correct state on first
  // paint, with no signed-out flash.
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user ? { name: user.name, role: user.role } : null} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
