"use client";

import Link from "@/i18n/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { useCartStore } from "@/store/cart";
import BookCover from "@/components/books/BookCover";
import Price from "@/components/shared/Price";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { fill } from "@/i18n/format";

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const t = useDictionary();
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
            {t.cart.hero}{" "}
            <span className="font-semibold text-brown-dark">
              {item.personalization.childName}
            </span>
          </p>
        )}
        <p className="mt-0.5 text-sm text-brown-300">
          {fill(t.common.pagesAndCover, { pages: item.book.pageCount })}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-1 rounded-full border-2 border-cream-200 p-1">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream-100"
              aria-label={t.cart.decrease}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
            <span
              className="w-6 text-center text-sm font-bold text-brown-dark"
              aria-label={fill(t.cart.quantity, { count: item.quantity })}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream-100"
              aria-label={t.cart.increase}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-extrabold text-brown-dark">
              <Price amount={item.price * item.quantity} />
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-brown-300 transition-colors hover:bg-brand-50 hover:text-brand-500"
              aria-label={fill(t.cart.removeItem, { title: item.book.shortTitle })}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
