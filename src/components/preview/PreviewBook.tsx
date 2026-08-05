"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import type { GeneratedProject } from "@/types";
import BookCover from "@/components/books/BookCover";

interface PreviewBookProps {
  project: GeneratedProject;
}

/**
 * Shows the real cover plus the personalization we captured. Deliberately
 * honest: this is the draft we work from, not a finished illustrated page.
 */
export default function PreviewBook({ project }: PreviewBookProps) {
  const { book, personalization } = project;

  return (
    <div className="w-full">
      <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
        <BookCover book={book} size="lg" priority />

        <div className="mt-6 rounded-3xl bg-cream-100 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brown-300">
            Персонализация
          </p>
          <div className="mt-4 flex items-center gap-4">
            {personalization.photoUrl ? (
              <Image
                src={personalization.photoUrl}
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
        Это предварительный макет. Иллюстрации с лицом ребёнка наши художники
        подготовят после оформления заказа.
      </p>
    </div>
  );
}
