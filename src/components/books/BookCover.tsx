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
 * A bound hardback, not a picture of one.
 *
 * The artwork files are flat cover faces. Everything that makes one read as a
 * physical book is drawn here, so it is identical on every product however
 * light or dark the artwork happens to be.
 *
 * Two earlier attempts failed, and the reasons are worth keeping:
 *
 *  1. A translucent dark gradient laid over the artwork. Plainly visible on a
 *     pale sky, invisible on a dark forest — so half the catalogue looked bound
 *     and half looked like a flat PNG.
 *
 *  2. An opaque board beside the face, five percent wide. Consistent, but
 *     wrong: a book seen face-on does not show its spine at full width. You
 *     are either looking at the front board or at the spine, never at both
 *     square-on, and the eye catches the impossibility even when it cannot
 *     name it. It read as a brown stripe glued to the picture.
 *
 * What is drawn instead is what a hardback actually presents face-on: the
 * rounded spine curving away at the left, the hinge groove a few millimetres
 * in from it, the highlight along the top board, and the page block peeking
 * past the fore edge on the right. Every dimension is a percentage, so the
 * same book survives a 160px thumbnail and a 560px product shot.
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

      {/* The fore edge is noticeably rounder than the bound edge. Matching that
          asymmetry is most of what makes the silhouette read as a book. */}
      <div className="relative h-full w-full overflow-hidden rounded-l-[2px] rounded-r-lg shadow-[0_16px_30px_-14px_rgba(74,45,26,0.5),0_4px_10px_-5px_rgba(74,45,26,0.32)]">
        <Image
          src={book.image}
          alt={`Обложка книги «${book.title}»`}
          fill
          priority={priority}
          unoptimized={unoptimized}
          sizes={sizeHints[size]}
          className="object-cover"
        />

        {/* The spine roll, curving out of sight. Darkening rather than opaque
            paint: it is the same edge of the same board, in shadow. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[3.2%]"
          style={{
            background:
              "linear-gradient(to right, rgba(18,9,3,0.82), rgba(42,24,11,0.46) 55%, rgba(64,38,19,0.12))",
          }}
        />

        {/* The hinge groove, where the board folds away from the spine. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[3.2%] w-[2.8%]"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.30), rgba(0,0,0,0.04) 70%, rgba(255,255,255,0.12))",
          }}
        />

        {/* Light catching the top board. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[3.2%] right-[2%] top-0 h-[1.6%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,250,240,0.78), rgba(255,250,240,0))",
          }}
        />

        {/* The page block past the fore edge. Hairlines, because a stack of
            paper is never one flat colour. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[1.6%] right-0 w-[2%] shadow-[-1px_0_2px_rgba(0,0,0,0.28)]"
          style={{
            background:
              "repeating-linear-gradient(to right, #f0e5d3 0 1px, #c8b395 1px 2px)",
          }}
        />

        {/* Volume, and the wear a cloth corner picks up. Percentage stops, so
            it survives being scaled down to a thumbnail — a px blur radius
            would swallow a small cover whole. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(130% 130% at 50% 45%, rgba(60,35,15,0) 58%, rgba(60,35,15,0.20) 100%)",
              "radial-gradient(9% 9% at 100% 0%, rgba(60,35,15,0.30), rgba(60,35,15,0) 70%)",
              "radial-gradient(9% 9% at 100% 100%, rgba(60,35,15,0.30), rgba(60,35,15,0) 70%)",
            ].join(", "),
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-l-[2px] rounded-r-lg ring-1 ring-inset ring-[rgba(60,35,15,0.18)]"
        />
      </div>
    </div>
  );
}
