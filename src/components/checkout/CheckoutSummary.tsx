"use client";

import Link from "@/i18n/navigation";
import { ShieldCheck } from "lucide-react";
import type { CartItem } from "@/types";
import BookCover from "@/components/books/BookCover";
import Price from "@/components/shared/Price";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { fill } from "@/i18n/format";

interface CheckoutSummaryProps {
  items: CartItem[];
  onSubmit?: () => void;
  isLoading?: boolean;
  /** Defaults to the dictionary's "place order" once the component mounts. */
  submitLabel?: string;
}

/**
 * Delivery is quoted at checkout, so the summary shows the goods total and says
 * so plainly rather than inventing a shipping figure.
 */
export default function CheckoutSummary({
  items,
  onSubmit,
  isLoading,
  submitLabel,
}: CheckoutSummaryProps) {
  const t = useDictionary();
  const action = submitLabel ?? t.checkout.submit;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="rounded-4xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-extrabold text-brown-dark">
        {t.checkout.summaryHeading}
      </h2>

      <ul className="mt-5 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="w-14 shrink-0 rounded-xl bg-cream-100 p-1.5">
              <BookCover book={item.book} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brown-dark">
                {item.book.shortTitle}
              </p>
              {item.personalization?.childName && (
                <p className="truncate text-xs text-brown-300">
                  {fill(t.checkout.summaryHero, { name: item.personalization.childName })}
                </p>
              )}
              <p className="text-xs text-brown-300">× {item.quantity}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-brown-dark">
              <Price amount={item.price * item.quantity} />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-cream-200 pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brown">{t.checkout.summaryBooks}</span>
          <span className="font-semibold text-brown-dark"><Price amount={subtotal} /></span>
        </div>
        <div className="mt-2.5 flex items-start justify-between gap-4 text-sm">
          <span className="text-brown">{t.checkout.summaryDelivery}</span>
          <span className="text-right text-brown-300">
            {t.checkout.summaryDeliveryValue}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-cream-200 pt-5">
        <span className="font-display text-base font-extrabold text-brown-dark">
          {t.checkout.summaryTotal}
        </span>
        <span className="font-display text-2xl font-extrabold text-brown-dark">
          <Price amount={subtotal} />
        </span>
      </div>

      {onSubmit && (
        <>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="btn-primary mt-6 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t.checkout.submitting : action}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-brown-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sage-500" strokeWidth={2} />
            {t.checkout.secure}
          </p>
        </>
      )}

      <p className="mt-3 text-center text-xs leading-relaxed text-brown-300">
        {fill(t.checkout.termsLead, { action })}{" "}
        <Link href="/terms" className="text-brand-500 hover:underline">
          {t.checkout.termsLink}
        </Link>
      </p>
    </div>
  );
}
