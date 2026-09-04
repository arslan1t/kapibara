import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

type CoverSize = "sm" | "md" | "lg";

interface BookCoverProps {
  book: Pick<Book, "image" | "title">;
  size?: CoverSize;
  priority?: boolean;
  className?: string;
  /** Adds a soft warm halo behind the cover — for hero and product moments. */
  glow?: boolean;
}

const sizeHints: Record<CoverSize, string> = {
  sm: "180px",
  md: "(min-width: 1024px) 30vw, 45vw",
  lg: "(min-width: 1024px) 560px, 92vw",
};

/**
 * A book, not a picture.
 *
 * The artwork files are flat square covers with no spine, corners or shadow —
 * deliberately, because when that presentation was baked into the images every
 * cover carried a slightly different version of it and the catalogue grid
 * showed books at visibly different sizes and finishes.
 *
 * It is drawn here instead, so it is identical on every product by
 * construction: a bound edge down the left, corners rounded more on the fore
 * edge than at the spine as a real hardback is, a highlight along the top where
 * the light catches the board, and a shadow underneath to lift it off the page.
 */
export default function BookCover({
  book,
  size = "md",
  priority = false,
  className,
  glow = false,
}: BookCoverProps) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-gold-200/40 blur-3xl"
        />
      )}

      <div className="relative h-full w-full">
        {/* rounded-l-sm / rounded-r-lg: a hardback's fore edge is noticeably
            rounder than its spine, and matching that is most of what makes the
            shape read as a book rather than a card. */}
        <div className="relative h-full w-full overflow-hidden rounded-l-sm rounded-r-lg shadow-[0_10px_28px_-8px_rgba(74,45,26,0.35)]">
          <Image
            src={book.image}
            alt={`Обложка книги «${book.title}»`}
            fill
            priority={priority}
            sizes={sizeHints[size]}
            className="object-cover"
          />

          {/* The bound edge. Two stops rather than one: a hard dark line where
              the boards meet, then a short gradient for the curve of the spine.
              A single flat bar reads as a printed stripe, not as binding. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[4.5%] bg-gradient-to-r from-black/45 via-black/15 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-px bg-black/30"
          />

          {/* Light catching the top board, and the fore edge falling away. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2%] bg-gradient-to-b from-white/25 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-[1.5%] bg-gradient-to-l from-black/12 to-transparent"
          />

          {/* Keeps the artwork from bleeding into the rounded corner. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-l-sm rounded-r-lg ring-1 ring-inset ring-black/10"
          />
        </div>
      </div>
    </div>
  );
}
