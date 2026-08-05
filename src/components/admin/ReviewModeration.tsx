"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Pin, AlertCircle } from "lucide-react";
import { moderateReview, toggleReviewFeatured } from "@/app/actions/reviews";
import type { ReviewStatus } from "@/lib/constants";

interface Props {
  reviewId: string;
  status: ReviewStatus;
  featured: boolean;
  moderatorNote: string;
}

/**
 * Approve / reject / pin controls.
 *
 * The rejection note is required, so a rejected review always carries a reason
 * the author can be told.
 */
export default function ReviewModeration({
  reviewId,
  status,
  featured,
  moderatorNote,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState(moderatorNote);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setBusy(true);
    const result = await fn();
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Не удалось выполнить действие");
      return;
    }

    setRejecting(false);
    startTransition(() => router.refresh());
  }

  const disabled = busy || pending;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status !== "approved" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => run(() => moderateReview(reviewId, "approved"))}
            className="inline-flex items-center gap-1.5 rounded-full bg-sage-200 px-4 py-2 text-sm font-semibold text-sage-500 transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Одобрить
          </button>
        )}

        {status !== "rejected" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRejecting((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Отклонить
          </button>
        )}

        {status === "approved" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => run(() => toggleReviewFeatured(reviewId, !featured))}
            aria-pressed={featured}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60 ${
              featured
                ? "bg-gold-200 text-brown-dark"
                : "bg-cream-200 text-brown-dark"
            }`}
          >
            <Pin className="h-4 w-4" aria-hidden="true" />
            {featured ? "Снять с главной" : "На главную"}
          </button>
        )}
      </div>

      {rejecting && (
        <div className="mt-3">
          <label
            htmlFor={`note-${reviewId}`}
            className="text-sm font-medium text-brown-dark"
          >
            Причина отклонения
          </label>
          <textarea
            id={`note-${reviewId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Например: отзыв содержит личные данные третьих лиц"
            className="mt-1.5 w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-brown-dark focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="button"
            disabled={disabled || note.trim().length < 3}
            onClick={() => run(() => moderateReview(reviewId, "rejected", note))}
            className="mt-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Подтвердить отклонение
          </button>
        </div>
      )}

      {moderatorNote && !rejecting && (
        <p className="mt-2 text-xs leading-relaxed text-brown">
          Причина: {moderatorNote}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
