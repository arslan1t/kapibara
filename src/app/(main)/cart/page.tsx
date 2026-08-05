"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CartItemRow from "@/components/cart/CartItemRow";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import EmptyState from "@/components/shared/EmptyState";
import Mascot from "@/components/shared/Mascot";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-300 border-t-brand-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20">
        <div className="page-container mx-auto max-w-lg">
          <EmptyState
            illustration={<Mascot variant={2} float />}
            title="Корзина пуста"
            description="Выберите историю и создайте книгу с именем вашего ребёнка."
            action={{ label: "Выбрать книгу", href: "/catalog" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-14">
      <div className="page-container">
        <Link
          href="/catalog"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brown transition-colors hover:text-brown-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          В каталог
        </Link>

        <h1 className="font-display text-3xl font-extrabold text-brown-dark sm:text-4xl">
          Корзина
        </h1>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <CheckoutSummary
              items={items}
              onSubmit={() => router.push("/checkout")}
              submitLabel="Перейти к оформлению"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
