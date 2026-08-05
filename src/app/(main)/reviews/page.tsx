import type { Metadata } from "next";
import Link from "next/link";
import { Info, Star } from "lucide-react";
import TestimonialCard from "@/components/shared/TestimonialCard";
import Reveal from "@/components/shared/Reveal";
import Mascot from "@/components/shared/Mascot";
import { getApprovedReviews, getSiteRatingSummary } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Отзывы",
  description: "Отзывы родителей о персональных книгах Капибара.",
};

export const dynamic = "force-dynamic";

/**
 * Only approved reviews from verified purchases are shown.
 *
 * When there are none, the page says so rather than filling the gap with
 * invented testimonials — an empty section is honest, a fabricated one is not.
 */
export default async function ReviewsPage() {
  const [reviews, summary] = await Promise.all([
    getApprovedReviews(),
    getSiteRatingSummary(),
  ]);

  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Отзывы</span>
          <h1 className="section-title mt-5">Что говорят родители</h1>

          {summary.average !== null ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-soft">
              <Star className="h-5 w-5 fill-gold-300 text-gold-300" aria-hidden="true" />
              <span className="font-display text-lg font-extrabold text-brown-dark">
                {summary.average.toLocaleString("ru-RU", {
                  minimumFractionDigits: 1,
                })}
              </span>
              <span className="text-sm text-brown">
                {summary.count}{" "}
                {summary.count === 1
                  ? "отзыв"
                  : summary.count < 5
                    ? "отзыва"
                    : "отзывов"}
              </span>
            </p>
          ) : (
            <p className="section-subtitle">
              Каждый отзыв здесь оставлен человеком, который получил книгу.
            </p>
          )}
        </Reveal>

        {reviews.length === 0 ? (
          <Reveal delay={80} className="mx-auto mt-14 max-w-lg text-center">
            <Mascot variant={2} float />
            <h2 className="mt-6 font-display text-xl font-extrabold text-brown-dark">
              Отзывов пока нет
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-brown">
              Мы публикуем только отзывы покупателей, которые действительно
              получили книгу. Как только появятся первые — они будут здесь.
            </p>
            <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-3xl bg-cream-100 px-5 py-4 text-left">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-brown">
                Мы не публикуем придуманные отзывы и не покупаем их. Оставить
                отзыв может только покупатель после доставки заказа.
              </p>
            </div>
            <Link href="/catalog" className="btn-primary mt-8 text-base">
              Создать свою книгу
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
                Создать свою книгу
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
