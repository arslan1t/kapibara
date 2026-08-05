import { cn } from "@/lib/utils";

type DividerVariant = "wave" | "hill" | "cloud" | "arch" | "torn";

interface SectionDividerProps {
  /** Shape of the seam between two sections. */
  variant?: DividerVariant;
  /**
   * Which section the shape belongs to. "bottom" sits at the end of a section
   * and is filled with the *next* section's colour, pulling it upward.
   * "top" sits at the start of a section and reaches back into the previous one.
   */
  position?: "bottom" | "top";
  /** Fill comes from `currentColor`, so pass a text-* class (e.g. "text-parchment"). */
  className?: string;
  /** Visual height. Dividers scale independently of the viewport width. */
  height?: "sm" | "md" | "lg";
}

const paths: Record<DividerVariant, string> = {
  // Gentle rolling swell — the calmest seam.
  wave:
    "M0,72 C220,116 420,20 720,44 C1020,68 1230,120 1440,64 L1440,140 L0,140 Z",
  // A soft meadow mound rising in the middle.
  hill: "M0,140 C300,26 560,10 720,10 C880,10 1140,26 1440,140 Z",
  // Puffy storybook cloud edge.
  cloud:
    "M0,140 L0,96 Q54,52 122,80 Q170,28 250,62 Q318,18 392,66 Q462,30 534,72 Q612,34 686,74 Q758,40 838,72 Q908,32 982,68 Q1054,30 1126,70 Q1196,36 1276,68 Q1350,44 1440,80 L1440,140 Z",
  // Wide theatrical arc — good before a "reveal" moment.
  arch: "M0,140 C480,-8 960,-8 1440,140 Z",
  // Ripped-paper edge, like a page torn from a book.
  torn:
    "M0,140 L0,74 L60,88 L118,66 L182,86 L246,62 L308,84 L372,60 L438,82 L500,58 L566,80 L630,56 L696,78 L760,54 L826,76 L890,52 L954,74 L1018,50 L1084,72 L1148,48 L1214,70 L1278,46 L1344,68 L1400,50 L1440,64 L1440,140 Z",
};

const heights: Record<NonNullable<SectionDividerProps["height"]>, string> = {
  sm: "h-10 sm:h-14",
  md: "h-14 sm:h-20 md:h-24",
  lg: "h-20 sm:h-28 md:h-36",
};

/**
 * A shaped seam between two sections, so colour changes flow into each other
 * instead of butting against a hard horizontal line.
 *
 * Drop it in as the last child of a `relative` section:
 *   <SectionDivider variant="hill" className="text-parchment" />
 *
 * The SVG stretches edge-to-edge (`preserveAspectRatio="none"`) and is purely
 * decorative, so it is hidden from assistive technology.
 */
export default function SectionDivider({
  variant = "wave",
  position = "bottom",
  className,
  height = "md",
}: SectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 w-full",
        heights[height],
        position === "bottom" ? "bottom-0" : "top-0 rotate-180",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        className="h-full w-full"
        focusable="false"
      >
        <path d={paths[variant]} fill="currentColor" />
      </svg>
    </div>
  );
}
