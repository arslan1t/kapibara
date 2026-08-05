import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck, User as UserIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Заказ",
  robots: { index: false, follow: false },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;

  // The userId filter is what prevents reading someone else's order by id.
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { include: { personalization: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brown transition-colors hover:text-brown-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Все заказы
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-brown-400">
            от {order.createdAt.toLocaleDateString("ru-RU")}
          </p>
        </div>
        <span
          className={`badge ${ORDER_STATUS_TONE[order.orderStatus as OrderStatus]}`}
        >
          {ORDER_STATUS_LABELS[order.orderStatus as OrderStatus]}
        </span>
      </div>

      {/* ── Items and their personalization ── */}
      <section className="mt-8 rounded-4xl bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-brown-dark">
          Состав заказа
        </h2>
        <ul className="mt-4 divide-y divide-cream-200">
          {order.items.map((item) => (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-semibold text-brown-dark">
                  {item.productTitle}
                  {item.quantity > 1 && (
                    <span className="text-brown-400"> × {item.quantity}</span>
                  )}
                </p>
                <p className="font-display font-extrabold text-brown-dark">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>

              {item.personalization && (
                <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-2xl bg-cream-100 p-4 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-brown-400">Имя ребёнка:</dt>
                    <dd className="font-semibold text-brown-dark">
                      {item.personalization.childName}
                    </dd>
                  </div>
                  {item.personalization.childAge != null && (
                    <div className="flex gap-2">
                      <dt className="text-brown-400">Возраст:</dt>
                      <dd className="font-semibold text-brown-dark">
                        {item.personalization.childAge}
                      </dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="text-brown-400">Фотография:</dt>
                    <dd className="font-semibold text-brown-dark">
                      {item.personalization.photoKey ? "Загружена" : "Не добавлена"}
                    </dd>
                  </div>
                  {item.personalization.dedication && (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="shrink-0 text-brown-400">Посвящение:</dt>
                      <dd className="text-brown-dark">
                        {item.personalization.dedication}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-cream-200 pt-5 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-brown">Товары</dt>
            <dd className="text-brown-dark">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown">Доставка</dt>
            <dd className="text-brown-dark">
              {order.deliveryPrice > 0
                ? formatPrice(order.deliveryPrice)
                : "рассчитывается"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-cream-200 pt-3">
            <dt className="font-display font-extrabold text-brown-dark">Итого</dt>
            <dd className="font-display text-xl font-extrabold text-brown-dark">
              {formatPrice(order.total)}
            </dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt className="text-brown">Оплата</dt>
            <dd className="text-brown-dark">
              {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Delivery ── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-4xl bg-white p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-brown-dark">
            <Truck className="h-5 w-5 text-brand-500" strokeWidth={1.8} />
            Доставка
          </h2>
          <p className="mt-3 text-[15px] text-brown">
            {DELIVERY_METHOD_LABELS[order.deliveryMethod as DeliveryMethod] ??
              order.deliveryMethod}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-brown-dark">
            {order.deliveryAddress}
          </p>
        </div>

        <div className="rounded-4xl bg-white p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-brown-dark">
            <UserIcon className="h-5 w-5 text-brand-500" strokeWidth={1.8} />
            Получатель
          </h2>
          <p className="mt-3 text-[15px] text-brown-dark">{order.customerName}</p>
          <p className="text-[15px] text-brown">{order.customerPhone}</p>
          <p className="text-[15px] text-brown">{order.customerEmail}</p>
        </div>
      </section>

      {/* ── Status history ── */}
      {order.history.length > 0 && (
        <section className="mt-6 rounded-4xl bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-brown-dark">
            История заказа
          </h2>
          <ol className="mt-4 space-y-3">
            {order.history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm text-brown-400">
                  {entry.createdAt.toLocaleDateString("ru-RU")}
                </span>
                <span className="text-[15px] font-semibold text-brown-dark">
                  {ORDER_STATUS_LABELS[entry.toStatus as OrderStatus] ??
                    entry.toStatus}
                </span>
                {entry.note && (
                  <span className="text-sm text-brown">— {entry.note}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
