import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { Info, Star } from "lucide-react";
import TestimonialCard from "@/components/shared/TestimonialCard";
import Reveal from "@/components/shared/Reveal";
import Mascot from "@/components/shared/Mascot";
import { getApprovedReviews, getSiteRatingSummary } from "@/lib/reviews";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { formatNumber, plural } from "@/i18n/format";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return {
    title: t.reviewsPage.metaTitle,
    description: t.reviewsPage.metaDescription,
  };
}

export const dynamic = "force-dynamic";

/**
 * Only approved reviews from verified purchases are shown.
 *
 * When there are none, the page says so rather than filling the gap with
 * invented testimonials — an empty section is honest, a fabricated one is not.
 */
export default async function ReviewsPage({
  params,
}: {
  params: Promise<LangParams>;
}) {
  const locale = localeFromSegment((await params).lang);
  const t = getDictionary(locale);
  const [reviews, summary] = await Promise.all([
    getApprovedReviews(),
    getSiteRatingSummary(),
  ]);

  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t.reviewsPage.eyebrow}</span>
          <h1 className="section-title mt-5">{t.reviewsPage.heading}</h1>

          {summary.average !== null ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-soft">
              <Star className="h-5 w-5 fill-gold-300 text-gold-300" aria-hidden="true" />
              <span className="font-display text-lg font-extrabold text-brown-dark">
{formatNumber(summary.average, locale)}
              </span>
              <span className="text-sm text-brown">
                {plural(summary.count, t.book.reviewCount, locale)}
              </span>
            </p>
          ) : (
            <p className="section-subtitle">
              {t.reviewsPage.verified}
            </p>
          )}
        </Reveal>

        {reviews.length === 0 ? (
          <Reveal delay={80} className="mx-auto mt-14 max-w-lg text-center">
            <Mascot variant={2} float />
            <h2 className="mt-6 font-display text-xl font-extrabold text-brown-dark">
              {t.reviewsPage.emptyHeading}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-brown">
{t.reviewsPage.emptyLead}
            </p>
            <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-3xl bg-cream-100 px-5 py-4 text-left">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-brown">
{t.reviewsPage.policy}
              </p>
            </div>
            <Link href="/catalog" className="btn-primary mt-8 text-base">
              {t.reviewsPage.cta}
            </Link>
          </Reveal>
        ) : (
          <>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={(i % 3) * 90}>
                  <TestimonialCard
                    review={{
                      id: review.id,
                      rating: review.rating,
                      text: review.text,
                      authorName: review.authorName,
                      productTitle: review.productTitle,
                      createdAt: review.createdAt,
                    }}
                  />
                </Reveal>
              ))}
            </div>

            <Reveal delay={150} className="mt-16 text-center">
              <Link href="/catalog" className="btn-primary text-base">
                {t.reviewsPage.cta}
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
