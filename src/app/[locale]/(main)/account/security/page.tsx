import type { Metadata } from "next";
import PasswordForm from "@/components/account/PasswordForm";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return {
    title: t.account.securityTitle,
    robots: { index: false, follow: false },
  };
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        {t.account.securityTitle}
      </h1>
      <p className="mt-2 text-[15px] text-brown">
        {t.account.securityLead}
      </p>

      <div className="mt-8 max-w-lg rounded-4xl bg-white p-5 shadow-soft sm:p-7">
        <PasswordForm />
      </div>
    </div>
  );
}
