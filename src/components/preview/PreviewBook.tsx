"use client";

import Image from "next/image";
import { Info, Loader2 } from "lucide-react";
import type { GeneratedProject } from "@/types";
import BookCover from "@/components/books/BookCover";
import type { JobState } from "@/components/preview/GenerationPanel";

interface PreviewBookProps {
  project: GeneratedProject;
  /** Null until generation starts; drives what fills the main image slot. */
  job?: JobState | null;
}

/**
 * Shows the real cover plus the personalization we captured. Deliberately
 * honest: this is the draft we work from, not a finished illustrated page.
 */
export default function PreviewBook({ project, job }: PreviewBookProps) {
  const { book, personalization } = project;

  // photoUrl is a blob: handle created on the previous screen and is already
  // dead by the time this page loads. The stored object is the one that
  // survives, served through the route that checks entitlement.
  const photoSrc =
    personalization.photoUrl ??
    (personalization.photoKey ? `/api/uploads/${personalization.photoKey}` : undefined);

  const working = job?.status === "queued" || job?.status === "processing";
  const illustration = job?.status === "succeeded" ? job.pages[0] : undefined;

  return (
    <div className="w-full">
      <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
        {/* The main slot belongs to the customer's own illustration. Leaving
            the series cover here while their picture is being drawn was the
            single most confusing thing on this page: the largest image showed
            a different child, and the only sign anything was happening sat
            below the fold. */}
        {illustration ? (
          <figure>
            <Image
              src={`/api/uploads/${illustration.storageKey}`}
              alt={`${personalization.childName} в иллюстрации из книги`}
              width={720}
              height={720}
              unoptimized
              priority
              className="aspect-square w-full rounded-3xl object-cover"
            />
            <figcaption className="mt-3 text-center text-sm text-brown">
              {personalization.childName} в сцене из книги
            </figcaption>
          </figure>
        ) : working ? (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-brand-100 via-cream-100 to-cream-200 px-6 text-center">
            <Loader2
              className="h-10 w-10 animate-spin text-brand-500"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-extrabold text-brown-dark">
              Рисуем {personalization.childName}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-brown">
              Обычно одна–три минуты. Готовая иллюстрация появится прямо здесь.
            </p>
          </div>
        ) : (
          <BookCover book={book} size="lg" priority />
        )}

        <div className="mt-6 rounded-3xl bg-cream-100 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brown-300">
            Персонализация
          </p>
          <div className="mt-4 flex items-center gap-4">
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={`Фотография: ${personalization.childName}`}
                width={72}
                height={72}
                unoptimized
                className="shrink-0 rounded-2xl border-2 border-white object-cover shadow-soft"
                style={{ height: 72, width: 72 }}
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-cream-300 text-xs text-brown-300">
                нет фото
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold leading-tight text-brown-dark">
                {personalization.childName}
              </p>
              <p className="mt-1 text-sm text-brown">
                {personalization.childAge
                  ? `${personalization.childAge} лет · главный герой`
                  : "Главный герой истории"}
              </p>
            </div>
          </div>

          {personalization.dedication?.trim() && (
            <p className="mt-4 border-t border-cream-300 pt-4 text-sm italic leading-relaxed text-brown">
              «{personalization.dedication.trim()}»
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-100 px-4 py-3.5 text-sm leading-relaxed text-brown">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" strokeWidth={2} />
        Это обложка серии. Иллюстрация с вашим ребёнком создаётся ниже —
        окончательный макет мы согласуем с вами до печати.
      </p>
    </div>
  );
}
