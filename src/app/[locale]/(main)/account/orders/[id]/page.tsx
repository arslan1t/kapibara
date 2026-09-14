import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck, User as UserIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill, formatDate, formatAmount } from "@/i18n/format";
import { ORDER_STATUS_TONE, type DeliveryMethod, type OrderStatus, type PaymentStatus } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams & { id: string }>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return { title: t.account.orderTitle, robots: { index: false, follow: false } };
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<LocaleParams & { id: string }>;
}) {
  const { id, locale: raw } = await params;
  const locale = asLocale(raw);
  const t = getDictionary(locale);
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
        {t.account.allOrders}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-brown-400">
            {fill(t.account.orderedOn, { date: formatDate(order.createdAt, locale) })}
          </p>
        </div>
        <span
          className={`badge ${ORDER_STATUS_TONE[order.orderStatus as OrderStatus]}`}
        >
          {t.orderStatus[order.orderStatus as OrderStatus]}
        </span>
      </div>

      {/* ── Items and their personalization ── */}
      <section className="mt-8 rounded-4xl bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-brown-dark">
          {t.account.orderContents}
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
                  {formatAmount(item.lineTotal, order.currency, locale)}
                </p>
              </div>

              {item.personalization && (
                <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-2xl bg-cream-100 p-4 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-brown-400">{t.account.childName}</dt>
                    <dd className="font-semibold text-brown-dark">
                      {item.personalization.childName}
                    </dd>
                  </div>
                  {item.personalization.childAge != null && (
                    <div className="flex gap-2">
                      <dt className="text-brown-400">{t.account.childAge}</dt>
                      <dd className="font-semibold text-brown-dark">
                        {item.personalization.childAge}
                      </dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="text-brown-400">{t.account.photo}</dt>
                    <dd className="font-semibold text-brown-dark">
                      {item.personalization.photoKey
                        ? t.account.photoUploaded
                        : t.account.photoMissing}
                    </dd>
                  </div>
                  {item.personalization.dedication && (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="shrink-0 text-brown-400">{t.account.dedication}</dt>
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
            <dt className="text-brown">{t.account.goods}</dt>
            <dd className="text-brown-dark">{formatAmount(order.subtotal, order.currency, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown">{t.account.delivery}</dt>
            <dd className="text-brown-dark">
              {order.deliveryPrice > 0
                ? formatAmount(order.deliveryPrice, order.currency, locale)
                : t.account.deliveryPending}
            </dd>
          </div>
          <div className="flex justify-between border-t border-cream-200 pt-3">
            <dt className="font-display font-extrabold text-brown-dark">{t.account.total}</dt>
            <dd className="font-display text-xl font-extrabold text-brown-dark">
              {formatAmount(order.total, order.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt className="text-brown">{t.account.payment}</dt>
            <dd className="text-brown-dark">
              {t.paymentStatus[order.paymentStatus as PaymentStatus]}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Delivery ── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-4xl bg-white p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-brown-dark">
            <Truck className="h-5 w-5 text-brand-500" strokeWidth={1.8} />
            {t.account.deliveryHeading}
          </h2>
          <p className="mt-3 text-[15px] text-brown">
            {t.deliveryMethod[order.deliveryMethod as DeliveryMethod] ??
              order.deliveryMethod}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-brown-dark">
            {order.deliveryAddress}
          </p>
        </div>

        <div className="rounded-4xl bg-white p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-brown-dark">
            <UserIcon className="h-5 w-5 text-brand-500" strokeWidth={1.8} />
            {t.account.recipient}
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
            {t.account.history}
          </h2>
          <ol className="mt-4 space-y-3">
            {order.history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm text-brown-400">
                  {formatDate(entry.createdAt, locale)}
                </span>
                <span className="text-[15px] font-semibold text-brown-dark">
                  {t.orderStatus[entry.toStatus as OrderStatus] ??
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
