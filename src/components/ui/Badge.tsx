import { cn } from "@/lib/utils";

type BadgeVariant =
  | "orange"
  | "green"
  | "brown"
  | "red"
  | "blue"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  orange: "bg-brand-100 text-brand-500",
  green: "bg-sage-100 text-sage-500",
  brown: "bg-cream-200 text-brown",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
  default: "bg-cream-200 text-brown-dark",
};

export default function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
