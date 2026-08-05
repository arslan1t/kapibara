"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import BookCover from "@/components/books/BookCover";

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-5 rounded-4xl bg-white p-5 shadow-soft">
      <Link
        href={`/books/${item.book.slug}`}
        className="w-24 shrink-0 self-start rounded-2xl bg-cream-100 p-2 sm:w-28"
      >
        <BookCover book={item.book} size="sm" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/books/${item.book.slug}`}>
          <h3 className="font-display text-[17px] font-extrabold leading-snug text-brown-dark transition-colors hover:text-brand-500">
            {item.book.title}
          </h3>
        </Link>

        {item.personalization?.childName && (
          <p className="mt-1.5 text-sm text-brown">
            Главный герой:{" "}
            <span className="font-semibold text-brown-dark">
              {item.personalization.childName}
            </span>
          </p>
        )}
        <p className="mt-0.5 text-sm text-brown-300">
          {item.book.pageCount} страниц · твёрдая обложка
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-1 rounded-full border-2 border-cream-200 p-1">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream-100"
              aria-label="Уменьшить количество"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
            <span
              className="w-6 text-center text-sm font-bold text-brown-dark"
              aria-label={`Количество: ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream-100"
              aria-label="Увеличить количество"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-extrabold text-brown-dark">
              {formatPrice(item.price * item.quantity)}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-brown-300 transition-colors hover:bg-brand-50 hover:text-brand-500"
              aria-label={`Удалить «${item.book.shortTitle}» из корзины`}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
