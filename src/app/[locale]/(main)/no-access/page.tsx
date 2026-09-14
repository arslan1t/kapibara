import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { ShieldAlert } from "lucide-react";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return {
    title: t.misc.noAccessTitle,
    robots: { index: false, follow: false },
  };
}

export default async function NoAccessPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const t = getDictionary(asLocale((await params).locale));
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="page-container mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-4xl bg-white text-brand-500 shadow-elevated">
          <ShieldAlert className="h-8 w-8" strokeWidth={1.7} />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
          {t.misc.noAccessHeading}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brown">
{t.misc.noAccessLead}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-primary">
            {t.misc.toHome}
          </Link>
          <Link href="/account" className="btn-secondary">
            {t.misc.toAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}
