"use client";

import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
}

/** Password field with a show/hide control that stays reachable by keyboard. */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-brown-dark">
          {label}
        </label>

        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "w-full rounded-xl border bg-white py-3 pl-4 pr-12 text-sm text-brown-dark placeholder:text-brown-400 outline-none transition-all duration-200 focus:ring-2",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-cream-300 focus:border-brand-200 focus:ring-brand-100",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brown-400 transition-colors hover:bg-cream-100 hover:text-brown-dark"
          >
            {visible ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={1.9} />
            )}
          </button>
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-brown-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
