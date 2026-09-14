import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/account/ProfileForm";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return {
    title: t.account.profileTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const session = (await getCurrentUser())!;
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { fullName: true, phone: true, email: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        {t.account.profileTitle}
      </h1>
      <p className="mt-2 text-[15px] text-brown">
        {t.account.profileLead}
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
