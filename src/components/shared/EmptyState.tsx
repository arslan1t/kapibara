import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  /** Full-size illustration, shown instead of the small icon. */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-cream-100 px-6 py-16 text-center">
      {illustration ? (
        <div className="mb-2 w-40 sm:w-48">{illustration}</div>
      ) : (
        icon && <div className="mb-4 opacity-50">{icon}</div>
      )}
      <h3 className="font-display text-xl font-bold text-brown-dark">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-brown">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className="btn-primary">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
