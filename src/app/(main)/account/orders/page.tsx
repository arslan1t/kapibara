import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { getReviewableItems } from "@/lib/reviews";
import ReviewForm from "@/components/account/ReviewForm";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Мои заказы",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = (await getCurrentUser())!;

  // Delivered books this customer has not reviewed yet. Scoped to their own
  // orders inside the helper.
  const reviewable = await getReviewableItems(user.id);

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: { id: true, productTitle: true, quantity: true },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Мои заказы
      </h1>

      {reviewable.length > 0 && (
        <section id="review" className="mt-8 scroll-mt-28">
          <h2 className="font-display text-xl font-extrabold text-brown-dark">
            {reviewable.length === 1
              ? "Расскажите о своей книге"
              : "Расскажите о своих книгах"}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-brown">
            Ваш заказ доставлен — поделитесь впечатлением. Отзыв появится на
            сайте после проверки.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {reviewable.map((item) => (
              <ReviewForm
                key={item.id}
                orderItemId={item.id}
                productTitle={item.productTitle}
                childName={item.personalization?.childName ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {orders.length === 0 ? (
        <div className="mt-8 rounded-4xl bg-white p-8 text-center shadow-soft">
          <Image
            src="/images/mascots/mascot-1.png"
            alt=""
            aria-hidden="true"
            width={420}
            height={420}
            className="mx-auto h-32 w-auto object-contain"
          />
          <p className="mt-3 font-display text-lg font-extrabold text-brown-dark">
            У вас пока нет заказов
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-brown">
            Как только вы оформите первый заказ, он появится здесь вместе со
            статусом изготовления.
          </p>
          <Link href="/catalog" className="btn-primary mt-6">
            Выбрать книгу
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="group block rounded-4xl bg-white p-5 shadow-soft transition-shadow hover:shadow-card sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-extrabold text-brown-dark">
                      {order.orderNumber}
                    </p>
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

                <ul className="mt-4 space-y-1 border-t border-cream-200 pt-4 text-[15px] text-brown">
                  {order.items.map((item) => (
                    <li key={item.id} className="truncate">
                      {item.productTitle}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <span className="text-sm text-brown-400">
                    {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold text-brown-dark">
                    {formatPrice(order.total)}
                    <ChevronRight className="h-4 w-4 text-brand-500 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
