import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AccountSidebar from "@/components/account/AccountSidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already turns anonymous visitors away; this is the authoritative
  // check, since middleware alone is not a security boundary.
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-10 md:py-14">
      <div className="page-container">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <AccountSidebar isAdmin={user.role === "admin"} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
