import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Панель управления", template: "%s | Панель Капибары" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative check. Middleware redirects first, but the role is verified
  // against the database here so a stale token can never grant access.
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!(await isAdmin())) redirect("/no-access");

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNav userName={user.name} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
