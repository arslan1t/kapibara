import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import { legalDocument } from "@/lib/legal-docs";
import { type LangParams } from "@/i18n/config";
import { localeFromSegment } from "@/i18n/market";

/**
 * Canonical path for the personal-data policy.
 * `/privacy` remains as a short alias so older links keep working.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const doc = legalDocument(localeFromSegment((await params).lang), "privacy");
  return {
    title: doc.title,
    description: doc.intro,
    robots: { index: true, follow: true },
  };
}

export default async function PersonalDataPolicyPage({
  params,
}: {
  params: Promise<LangParams>;
}) {
  return <LegalDocument locale={localeFromSegment((await params).lang)} document="privacy" />;
}
