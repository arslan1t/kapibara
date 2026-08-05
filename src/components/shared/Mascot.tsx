import Image from "next/image";
import { cn } from "@/lib/utils";

interface MascotProps {
  /** 1 = capybara holding the book, 2 = the companion pose. */
  variant?: 1 | 2;
  className?: string;
  /**
   * Purely decorative by default. Pass alt text only when the mascot carries
   * meaning the surrounding copy does not already convey.
   */
  alt?: string;
  /** Slow, subtle drift. Respects prefers-reduced-motion via globals.css. */
  float?: boolean;
  priority?: boolean;
}

/**
 * The Капибара mascot.
 *
 * Rendered as a transparent PNG with `object-contain` and no background, so the
 * character is never boxed, cropped or stretched.
 */
export default function Mascot({
  variant = 1,
  className,
  alt,
  float = false,
  priority = false,
}: MascotProps) {
  return (
    <Image
      src={`/images/mascots/mascot-${variant}.png`}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      width={1254}
      height={1254}
      priority={priority}
      sizes="(min-width: 768px) 320px, 200px"
      className={cn(
        "h-auto w-full object-contain",
        float && "animate-float",
        className
      )}
    />
  );
}
