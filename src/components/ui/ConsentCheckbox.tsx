"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Label may contain links, so it is a node rather than a string. */
  children: ReactNode;
  invalid?: boolean;
}

/**
 * Consent checkbox with a generous tap target and readable multi-line label.
 *
 * The native input stays in the DOM (visually hidden, not `display:none`) so
 * it remains focusable, announced, and operable by keyboard and screen readers.
 */
export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  children,
  invalid,
}: ConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 flex shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid ? true : undefined}
          className="peer absolute h-6 w-6 cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200",
            "peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100",
            checked
              ? "border-brand-500 bg-brand-500 text-white"
              : invalid
                ? "border-red-400 bg-white"
                : "border-cream-400 bg-white"
          )}
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
      </span>

      <label
        htmlFor={id}
        className="cursor-pointer text-[13px] leading-relaxed text-brown sm:text-sm"
      >
        {children}
      </label>
    </div>
  );
}
