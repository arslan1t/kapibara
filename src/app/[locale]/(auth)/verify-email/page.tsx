import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmailToken } from "@/app/actions/account-recovery";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return { title: t.auth.verifyTitle, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * Consumes the verification token on load.
 *
 * Doing the work in the page rather than behind a button means the link in the
 * email does what the reader expects when they click it. It is safe here
 * because the token is single-use and confirms only the address it was issued
 * for — there is no destructive side effect to protect against.
 */
export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const { token } = await searchParams;
  const result = await verifyEmailToken(token ?? "", locale);

  if (!result.ok) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold text-brown-dark">
          {t.auth.verifyFailed}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">{result.error}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-brown">
          {t.auth.verifyFailedLead}
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          {t.auth.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-card">
      <div className="mb-4 flex justify-center">
        <CheckCircle2 className="h-12 w-12 text-sage-500" aria-hidden="true" />
      </div>
      <h1 className="font-display text-xl font-bold text-brown-dark">
        {t.auth.verifiedTitle}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-brown">
        {fill(t.auth.verifiedLead, { email: result.email ?? "" })}
      </p>
      <Link href="/account" className="btn-primary mt-6 inline-flex">
        {t.auth.toAccountShort}
      </Link>
    </div>
  );
}
