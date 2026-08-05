import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import BookCover from "@/components/books/BookCover";

interface CheckoutSummaryProps {
  items: CartItem[];
  onSubmit?: () => void;
  isLoading?: boolean;
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
  submitLabel = "Оформить заказ",
}: CheckoutSummaryProps) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="rounded-4xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-extrabold text-brown-dark">Ваш заказ</h2>

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
                  герой: {item.personalization.childName}
                </p>
              )}
              <p className="text-xs text-brown-300">× {item.quantity}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-brown-dark">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-cream-200 pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brown">Книги</span>
          <span className="font-semibold text-brown-dark">{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2.5 flex items-start justify-between gap-4 text-sm">
          <span className="text-brown">Доставка</span>
          <span className="text-right text-brown-300">рассчитывается при оформлении</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-cream-200 pt-5">
        <span className="font-display text-base font-extrabold text-brown-dark">Итого</span>
        <span className="font-display text-2xl font-extrabold text-brown-dark">
          {formatPrice(subtotal)}
        </span>
      </div>

      {onSubmit && (
        <>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="btn-primary mt-6 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Оформляем…" : submitLabel}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-brown-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sage-500" strokeWidth={2} />
            Безопасное оформление заказа
          </p>
        </>
      )}

      <p className="mt-3 text-center text-xs leading-relaxed text-brown-300">
        Нажимая «{submitLabel}», вы соглашаетесь с{" "}
        <Link href="/terms" className="text-brand-500 hover:underline">
          условиями
        </Link>
      </p>
    </div>
  );
}
