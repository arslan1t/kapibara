import type { Metadata } from "next";
import FAQAccordion from "@/components/shared/FAQAccordion";
import Link from "@/i18n/navigation";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return { title: t.faqPage.metaTitle, description: t.faqPage.metaDescription };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<LangParams>;
}) {
  const t = getDictionary(localeFromSegment((await params).lang));

  return (
    <div className="py-12 md:py-16">
      <div className="page-container mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="section-title">{t.faqPage.heading}</h1>
          <p className="section-subtitle">{t.faqPage.lead}</p>
        </div>

        <FAQAccordion items={t.faq} />

        <div className="mt-12 rounded-3xl border border-brand-100 bg-brand-50 p-8 text-center">
          <p className="font-display text-lg font-bold text-brown-dark">
            {t.faqPage.notFoundHeading}
          </p>
          <p className="mt-2 text-sm text-brown">{t.faqPage.notFoundLead}</p>
          <Link href="/contact" className="btn-primary mt-4 inline-flex">
            {t.faqPage.notFoundCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
