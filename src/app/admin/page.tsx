import Link from "next/link";
import { ShoppingBag, Clock, CheckCircle2, Users, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  type OrderStatus,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Statuses that count as "still being worked on". */
const IN_PROGRESS: OrderStatus[] = [
  "awaiting_confirmation",
  "in_progress",
  "personalization",
  "sent_to_print",
  "ready_to_ship",
  "in_delivery",
];

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    newOrders,
    inProgress,
    completed,
    customers,
    publishedProducts,
    recentOrders,
    paidAggregate,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { orderStatus: "new" } }),
    db.order.count({ where: { orderStatus: { in: IN_PROGRESS } } }),
    db.order.count({ where: { orderStatus: "completed" } }),
    db.user.count({ where: { role: "customer" } }),
    db.product.count({ where: { published: true, status: "available" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
    // Revenue counts only money actually marked as received, so the figure
    // never overstates what the business has taken.
    db.order.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { total: true },
    }),
  ]);

  const paidRevenue = paidAggregate._sum.total ?? 0;

  const stats = [
    { label: "Всего заказов", value: totalOrders, icon: ShoppingBag },
    { label: "Новые", value: newOrders, icon: Clock },
    { label: "В работе", value: inProgress, icon: Clock },
    { label: "Завершённые", value: completed, icon: CheckCircle2 },
    { label: "Клиенты", value: customers, icon: Users },
    { label: "Товары в продаже", value: publishedProducts, icon: BookOpen },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Сводка
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-100 text-brand-500">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm text-brown-400">{label}</p>
                <p className="font-display text-2xl font-extrabold text-brown-dark">
                  {value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Only shown once real money has been recorded. */}
      <div className="mt-3 rounded-2xl bg-white p-5 shadow-soft">
        <p className="text-sm text-brown-400">Выручка по оплаченным заказам</p>
        {paidRevenue > 0 ? (
          <p className="mt-1 font-display text-2xl font-extrabold text-brown-dark">
            {formatPrice(paidRevenue)}
          </p>
        ) : (
          <p className="mt-1 text-[15px] text-brown">
            Пока нет заказов со статусом «Оплачен». Сумма появится, когда оплата
            будет подтверждена.
          </p>
        )}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-extrabold text-brown-dark">
            Последние заказы
          </h2>
          {totalOrders > 0 && (
            <Link
              href="/admin/orders"
              className="text-sm font-bold text-brand-500 underline-offset-4 hover:underline"
            >
              Все заказы
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-8 text-center text-[15px] text-brown shadow-soft">
            Заказов пока нет. Как только покупатель оформит первый заказ, он
            появится здесь.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white p-4 shadow-soft transition-shadow hover:shadow-card"
                >
                  <span className="font-semibold text-brown-dark">
                    {order.orderNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-brown">
                    {order.customerName}
                  </span>
                  <span
                    className={`badge ${ORDER_STATUS_TONE[order.orderStatus as OrderStatus]}`}
                  >
                    {ORDER_STATUS_LABELS[order.orderStatus as OrderStatus]}
                  </span>
                  <span className="font-display font-extrabold text-brown-dark">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
