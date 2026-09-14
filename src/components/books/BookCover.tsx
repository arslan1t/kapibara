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
  /**
   * Skips Next's image optimizer. Required for a generated illustration: it is
   * served from /api/uploads, which authorizes the viewer and then redirects to
   * a short-lived signed URL, and the optimizer cannot follow that.
   */
  unoptimized?: boolean;
}

const sizeHints: Record<CoverSize, string> = {
  sm: "180px",
  md: "(min-width: 1024px) 30vw, 45vw",
  lg: "(min-width: 1024px) 560px, 92vw",
};

/**
 * A bound book, not a picture of one.
 *
 * The artwork files are flat cover faces. Everything that makes it read as a
 * physical book is drawn here, so it is identical on every product however
 * light or dark the artwork happens to be.
 *
 * The spine is an opaque band with the face sitting beside it, not a shadow
 * laid over the artwork. That was the first attempt and it failed exactly where
 * it mattered: a translucent dark gradient is clearly visible over a pale sky
 * and invisible over a dark forest, so half the catalogue looked bound and half
 * looked like a flat PNG.
 */
export default function BookCover({
  book,
  size = "md",
  priority = false,
  className,
  glow = false,
  unoptimized = false,
}: BookCoverProps) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-gold-200/40 blur-3xl"
        />
      )}

      {/* rounded-r more than rounded-l: a hardback's fore edge is noticeably
          rounder than its spine, and matching that is most of what makes the
          silhouette read as a book. */}
      <div className="relative flex h-full w-full overflow-hidden rounded-l-[3px] rounded-r-xl shadow-[0_12px_30px_-10px_rgba(74,45,26,0.45)]">
        {/* ── The bound edge ──
            Five stops across five percent of the width: the dark outer board,
            the lit curve of the binding, the crease where it turns, and the
            shadow it casts onto the face. Flat colour here reads as a printed
            stripe; it is the curve that reads as a spine. */}
        <div
          aria-hidden="true"
          className="relative h-full w-[5%] shrink-0 bg-[linear-gradient(to_right,#2f1b0f_0%,#4a2d1a_28%,#6b4630_52%,#3a2315_78%,#241109_100%)]"
        >
          {/* Highlight along the top edge of the boards. */}
          <span className="absolute inset-x-0 top-0 h-[1.5%] bg-white/25" />
        </div>

        {/* ── The face ── */}
        <div className="relative h-full flex-1">
          <Image
            src={book.image}
            alt={`Обложка книги «${book.title}»`}
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes={sizeHints[size]}
            className="object-cover"
          />

          {/* Shadow the spine throws across the gutter. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/28 to-transparent"
          />
          {/* Light on the top board, and the fore edge turning away. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2%] bg-gradient-to-b from-white/20 to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-[2%] bg-gradient-to-l from-black/18 to-transparent"
          />
        </div>

        {/* Keeps the artwork off the rounded corner and gives the boards an edge. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-l-[3px] rounded-r-xl ring-1 ring-inset ring-black/15"
        />
      </div>
    </div>
  );
}
