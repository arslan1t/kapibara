import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import { legalDocument } from "@/lib/legal-docs";
import { asLocale, type LocaleParams } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const doc = legalDocument(asLocale((await params).locale), "offer");
  return {
    title: doc.title,
    description: doc.intro,
    robots: { index: true, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  return <LegalDocument locale={asLocale((await params).locale)} document="offer" />;
}
