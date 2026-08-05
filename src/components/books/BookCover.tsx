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
 * Every book is square (1:1) artwork of a real printed cover. The wrapper owns
 * the aspect ratio so grids never shift while images load.
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
      <Image
        src={book.image}
        alt={`Обложка книги «${book.title}»`}
        fill
        priority={priority}
        sizes={sizeHints[size]}
        className="relative object-contain"
      />
    </div>
  );
}
