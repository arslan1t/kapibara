import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import { legalDocument } from "@/lib/legal-docs";
import { asLocale, type LocaleParams } from "@/i18n/config";

/**
 * Canonical path for the personal-data policy.
 * `/privacy` remains as a short alias so older links keep working.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const doc = legalDocument(asLocale((await params).locale), "privacy");
  return {
    title: doc.title,
    description: doc.intro,
    robots: { index: true, follow: true },
  };
}

export default async function PersonalDataPolicyPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  return <LegalDocument locale={asLocale((await params).locale)} document="privacy" />;
}
