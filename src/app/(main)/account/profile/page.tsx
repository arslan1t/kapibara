import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata: Metadata = {
  title: "Профиль",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = (await getCurrentUser())!;
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { fullName: true, phone: true, email: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Профиль
      </h1>
      <p className="mt-2 text-[15px] text-brown">
        Эти данные мы используем при оформлении заказа.
      </p>

      <div className="mt-8 max-w-lg rounded-4xl bg-white p-5 shadow-soft sm:p-7">
        <ProfileForm
          initialName={user?.fullName ?? ""}
          initialPhone={user?.phone ?? ""}
          email={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
