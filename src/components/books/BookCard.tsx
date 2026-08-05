import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Book } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import BookCover from "./BookCover";

interface BookCardProps {
  book: Book;
  priority?: boolean;
  className?: string;
}

/**
 * A story portal, not a marketplace tile: the artwork leads, the copy supports,
 * and the whole card lifts gently on hover.
 */
export default function BookCard({ book, priority = false, className }: BookCardProps) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-4xl bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-elevated",
        className
      )}
    >
      {/* Square artwork on a warm inner stage */}
      <Link
        href={`/books/${book.slug}`}
        className="relative block bg-gradient-to-b from-cream-100 to-cream-200/70 p-5 sm:p-7"
      >
        <BookCover
          book={book}
          size="md"
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        />
        <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brown-dark backdrop-blur-sm">
          {book.ageRange}
        </span>
      </Link>

      {/* Copy */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display text-xl font-extrabold leading-snug text-brown-dark">
          <Link
            href={`/books/${book.slug}`}
            className="transition-colors duration-300 hover:text-brand-500"
          >
            {book.title}
          </Link>
        </h3>

        <p className="mt-2.5 text-[15px] leading-relaxed text-brown">
          {book.shortDescription}
        </p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-2xl font-extrabold text-brown-dark">
            {formatPrice(book.price)}
          </span>
          <span className="text-sm text-brown-300">
            {book.pageCount} страниц · твёрдая обложка
          </span>
        </div>

        {/* CTAs pinned to the bottom so cards stay aligned */}
        <div className="mt-auto flex items-center gap-3 pt-6">
          <Link
            href={`/personalize/${book.slug}`}
            className="btn-primary flex-1 px-5 py-3 text-[15px]"
          >
            Создать эту книгу
          </Link>
          <Link
            href={`/books/${book.slug}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cream-300 text-brown-dark transition-all duration-300 hover:border-brand-300 hover:text-brand-500"
            aria-label={`Подробнее о книге «${book.title}»`}
          >
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  );
}
