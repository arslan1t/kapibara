import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  max = 5,
  size = "sm",
  showValue,
  className,
}: StarRatingProps) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < Math.round(rating)
              ? "fill-gold-300 text-gold-300"
              : "fill-cream-300 text-cream-300"
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-brown">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
