import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: "orange" | "green" | "blue" | "brown";
}

const colorMap = {
  orange: "bg-brand-100 text-brand-500",
  green: "bg-sage-100 text-sage-500",
  blue: "bg-blue-100 text-blue-500",
  brown: "bg-cream-200 text-brown",
};

export default function AdminStatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "orange",
}: AdminStatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-brown-400 font-medium">{title}</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-brown-dark">
            {value}
          </p>
          {change !== undefined && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-sage-500" : "text-red-500"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {isPositive ? "+" : ""}
              {change}%{changeLabel && <span className="text-brown-400 ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            colorMap[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
