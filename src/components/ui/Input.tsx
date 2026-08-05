"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-brown-dark"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-brown-dark placeholder:text-brown-400 outline-none transition-all duration-200 focus:ring-2",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-cream-300 focus:border-brand-200 focus:ring-brand-100",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-brown-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
