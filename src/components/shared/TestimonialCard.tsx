import { Star, Quote, BadgeCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";

export interface TestimonialCardData {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  productTitle?: string | null;
  createdAt?: Date | null;
  /**
   * True for illustrative placeholder content shown while no real review
   * exists. Rendered with a visible marker so it can never be mistaken for a
   * verified purchase.
   */
  isDemo?: boolean;
}

/**
 * One review.
 *
 * A real review is marked "подтверждённая покупка" because the schema only
 * allows it to exist against a delivered order line. A demo one says so.
 */
export default function TestimonialCard({ review }: { review: TestimonialCardData }) {
  return (
    <figure className="flex h-full flex-col gap-5 rounded-4xl bg-white p-7 shadow-card">
      <div className="flex items-start justify-between">
        <Quote className="h-8 w-8 shrink-0 text-brand-100" strokeWidth={1.8} aria-hidden="true" />
        <div
          className="flex items-center gap-0.5"
          role="img"
          aria-label={`Оценка ${review.rating} из 5`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              aria-hidden="true"
              className={
                i < review.rating
                  ? "h-4 w-4 fill-gold-300 text-gold-300"
                  : "h-4 w-4 fill-cream-200 text-cream-200"
              }
            />
          ))}
        </div>
      </div>

      <blockquote className="flex-1 text-[15px] leading-relaxed text-brown">
        {review.text}
      </blockquote>

      {review.productTitle && (
        <p className="text-xs text-brown">
          О книге:{" "}
          <span className="font-semibold text-brown-dark">{review.productTitle}</span>
        </p>
      )}

      <figcaption className="mt-auto flex items-center gap-3 border-t border-cream-200 pt-5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 font-display text-sm font-extrabold text-brand-500"
        >
          {getInitials(review.authorName)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brown-dark">{review.authorName}</p>
          {review.isDemo ? (
            <p className="text-xs text-brown">Демонстрационный отзыв</p>
          ) : (
            <p className="flex items-center gap-1 text-xs text-sage-500">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Подтверждённая покупка
              {review.createdAt && (
                <span className="text-brown">
                  {" · "}
                  {review.createdAt.toLocaleDateString("ru-RU", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
