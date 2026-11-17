import type { Metadata } from "next";
import NotFoundContent from "@/components/shared/NotFoundContent";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return {
    title: t.meta.notFoundTitle,
    robots: { index: false, follow: false },
  };
}

export default function NotFound() {
  return <NotFoundContent />;
}
