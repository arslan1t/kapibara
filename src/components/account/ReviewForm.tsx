"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { submitReview } from "@/app/actions/reviews";
import { REVIEW_MIN_LENGTH, REVIEW_MAX_LENGTH } from "@/lib/constants";

interface Props {
  orderItemId: string;
  productTitle: string;
  childName: string | null;
}

/**
 * Review form for a delivered book.
 *
 * Only rendered for order lines the server has already confirmed are
 * reviewable; the action re-checks that independently.
 */
export default function ReviewForm({ orderItemId, productTitle, childName }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const shown = hovered || rating;
  const tooShort = text.trim().length < REVIEW_MIN_LENGTH;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await submitReview({ orderItemId, rating, text });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-sage-100 p-4 text-sm text-sage-500"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          Спасибо! Отзыв отправлен на проверку и появится на сайте после
          модерации.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-cream-50 p-5">
      <p className="font-semibold text-brown-dark">
        Оцените книгу «{productTitle}»
      </p>
      {childName && (
        <p className="mt-0.5 text-sm text-brown">Имя ребёнка: {childName}</p>
      )}

      {/* Radio group rather than buttons, so a keyboard user gets arrow-key
          navigation and a screen reader announces the current value. */}
      <fieldset className="mt-4">
        <legend className="sr-only">Оценка от 1 до 5</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer p-0.5"
              onMouseEnter={() => setHovered(value)}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only peer"
              />
              <span className="sr-only">{value} из 5</span>
              <Star
                aria-hidden="true"
                className={`h-7 w-7 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 rounded ${
                  value <= shown
                    ? "fill-gold-300 text-gold-300"
                    : "fill-transparent text-cream-400"
                }`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label
          htmlFor={`review-text-${orderItemId}`}
          className="text-sm font-medium text-brown-dark"
        >
          Ваш отзыв
        </label>
        <textarea
          id={`review-text-${orderItemId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={REVIEW_MAX_LENGTH}
          placeholder="Что понравилось вам и ребёнку? Как выглядит книга вживую?"
          className="mt-1.5 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-[15px] leading-relaxed text-brown-dark placeholder:text-brown-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <p className="mt-1 text-xs text-brown">
          {tooShort
            ? `Ещё ${REVIEW_MIN_LENGTH - text.trim().length} символов`
            : `${text.trim().length} / ${REVIEW_MAX_LENGTH}`}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        isLoading={pending}
        disabled={rating === 0 || tooShort}
        className="mt-4"
      >
        {pending ? "Отправляем…" : "Отправить отзыв"}
      </Button>

      <p className="mt-3 text-xs leading-relaxed text-brown">
        Отзыв появится на сайте после проверки. Мы публикуем его под именем и
        первой буквой фамилии.
      </p>
    </form>
  );
}
