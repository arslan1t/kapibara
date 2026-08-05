import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { db } from "@/lib/db";
import { isGenerationEnabled } from "@/lib/generation";
import { formatPrice } from "@/lib/utils";
import OrderControls from "@/components/admin/OrderControls";
import RefreshPaymentButton from "@/components/admin/RefreshPaymentButton";
import GenerationControls from "@/components/admin/GenerationControls";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_ATTEMPT_STATUS_LABELS,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentProvider,
  type PaymentAttemptStatus,
  type GenerationStatus,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заказ" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { personalization: true } },
      history: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { fullName: true } } },
      },
      user: { select: { id: true, email: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  // Jobs are looked up by order line, not by product: one product has many
  // jobs, and only the one for this line is relevant here.
  const jobs = await db.generationJob.findMany({
    where: { orderItemId: { in: order.items.map((i) => i.id) } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderItemId: true,
      status: true,
      attempts: true,
      lastError: true,
      _count: { select: { results: true } },
    },
  });

  const jobByItem = new Map(jobs.map((j) => [j.orderItemId, j]));
  const generationEnabled = isGenerationEnabled();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brown transition-colors hover:text-brown-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Все заказы
      </Link>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
          {order.orderNumber}
        </h1>
        <p className="text-sm text-brown-400">
          Создан {order.createdAt.toLocaleString("ru-RU")}
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Left: contents ── */}
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-brown-dark">
              Состав и персонализация
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
                    <p className="font-semibold text-brown-dark">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>

                  {item.personalization && (
                    <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-xl bg-cream-100 p-4 text-sm sm:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="text-brown-400">Имя ребёнка:</dt>
                        <dd className="font-semibold text-brown-dark">
                          {item.personalization.childName}
                        </dd>
                      </div>
                      {item.personalization.childGender && (
                        <div className="flex gap-2">
                          <dt className="text-brown-400">Версия:</dt>
                          <dd className="text-brown-dark">
                            {item.personalization.childGender === "girl"
                              ? "для девочки"
                              : "для мальчика"}
                          </dd>
                        </div>
                      )}
                      {item.personalization.childAge != null && (
                        <div className="flex gap-2">
                          <dt className="text-brown-400">Возраст:</dt>
                          <dd className="text-brown-dark">
                            {item.personalization.childAge}
                          </dd>
                        </div>
                      )}
                      <div className="flex gap-2 sm:col-span-2">
                        <dt className="shrink-0 text-brown-400">Фотография:</dt>
                        <dd className="min-w-0 text-brown-dark">
                          {item.personalization.photoKey ? (
                            <a
                              href={`/api/uploads/${encodeURIComponent(item.personalization.photoKey)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-brand-500 hover:underline"
                            >
                              <ImageIcon className="h-4 w-4" strokeWidth={1.9} />
                              Открыть фотографию
                            </a>
                          ) : (
                            "не загружена"
                          )}
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

                  <div className="mt-3">
                    <GenerationControls
                      orderItemId={item.id}
                      hasPhoto={Boolean(item.personalization?.photoKey)}
                      enabled={generationEnabled}
                      job={(() => {
                        const found = jobByItem.get(item.id);
                        return found
                          ? {
                              id: found.id,
                              status: found.status as GenerationStatus,
                              attempts: found.attempts,
                              lastError: found.lastError,
                              resultCount: found._count.results,
                            }
                          : null;
                      })()}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1.5 border-t border-cream-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-brown">Товары</dt>
                <dd className="text-brown-dark">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brown">Доставка</dt>
                <dd className="text-brown-dark">
                  {order.deliveryPrice > 0
                    ? formatPrice(order.deliveryPrice)
                    : "не рассчитана"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-cream-200 pt-2">
                <dt className="font-display font-extrabold text-brown-dark">Итого</dt>
                <dd className="font-display text-lg font-extrabold text-brown-dark">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-brown-dark">
              Клиент и доставка
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-brown-400">Имя</dt>
                <dd className="mt-0.5 text-brown-dark">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-brown-400">Телефон</dt>
                <dd className="mt-0.5 text-brown-dark">{order.customerPhone}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-brown-400">Почта</dt>
                <dd className="mt-0.5 truncate text-brown-dark">
                  {order.customerEmail}
                </dd>
              </div>
              <div>
                <dt className="text-brown-400">Аккаунт</dt>
                <dd className="mt-0.5 text-brown-dark">
                  {order.user ? "зарегистрирован" : "гостевой заказ"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-brown-400">Доставка</dt>
                <dd className="mt-0.5 text-brown-dark">
                  {DELIVERY_METHOD_LABELS[order.deliveryMethod as DeliveryMethod] ??
                    order.deliveryMethod}
                  {" — "}
                  {order.deliveryAddress}
                </dd>
              </div>
              {order.customerComment && (
                <div className="sm:col-span-2">
                  <dt className="text-brown-400">Комментарий клиента</dt>
                  <dd className="mt-0.5 text-brown-dark">{order.customerComment}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-brown-dark">
              Платежи
            </h2>

            {order.payments.length === 0 ? (
              <p className="mt-3 text-sm text-brown">
                По этому заказу платежей не создавалось.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="rounded-xl bg-cream-50 p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-semibold text-brown-dark">
                        {PAYMENT_PROVIDER_LABELS[
                          payment.provider as PaymentProvider
                        ] ?? payment.provider}
                      </span>
                      <span className="badge bg-cream-300 text-brown-dark">
                        {PAYMENT_ATTEMPT_STATUS_LABELS[
                          payment.status as PaymentAttemptStatus
                        ] ?? payment.status}
                      </span>
                      <span className="font-display font-extrabold text-brown-dark">
                        {formatPrice(payment.amount)}
                      </span>
                      <span className="text-brown-400">
                        {payment.createdAt.toLocaleString("ru-RU")}
                      </span>
                    </div>

                    {payment.providerPaymentId && (
                      <p className="mt-1.5 break-all font-mono text-xs text-brown-400">
                        {payment.providerPaymentId}
                      </p>
                    )}

                    {/* The provider's own words, for reconciliation. Never
                        shown to the customer. */}
                    {payment.failureReason && (
                      <p className="mt-1.5 text-xs leading-relaxed text-red-600">
                        {payment.failureReason}
                      </p>
                    )}

                    {payment.provider !== "manual" &&
                      payment.status !== "succeeded" && (
                        <div className="mt-3">
                          <RefreshPaymentButton paymentId={payment.id} />
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-brown-dark">
              История статусов
            </h2>
            <ol className="mt-4 space-y-2.5">
              {order.history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
                >
                  <span className="text-brown-400">
                    {entry.createdAt.toLocaleString("ru-RU")}
                  </span>
                  <span className="font-semibold text-brown-dark">
                    {ORDER_STATUS_LABELS[entry.toStatus as OrderStatus] ??
                      entry.toStatus}
                  </span>
                  {entry.changedBy && (
                    <span className="text-brown-400">— {entry.changedBy.fullName}</span>
                  )}
                  {entry.note && <span className="text-brown">· {entry.note}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ── Right: controls ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-brown-dark">
              Управление
            </h2>
            <div className="mt-4">
              <OrderControls
                orderId={order.id}
                currentStatus={order.orderStatus}
                currentPayment={order.paymentStatus}
                currentNote={order.adminNote ?? ""}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
