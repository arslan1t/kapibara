import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заказы" };

type SearchParams = Promise<{
  q?: string;
  status?: string;
  payment?: string;
  sort?: string;
}>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", status = "", payment = "", sort = "desc" } = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (q.trim()) {
    // SQLite's LIKE is case-insensitive for ASCII, which covers order numbers
    // and emails; names are matched as typed.
    where.OR = [
      { orderNumber: { contains: q.trim() } },
      { customerName: { contains: q.trim() } },
      { customerEmail: { contains: q.trim() } },
      { customerPhone: { contains: q.trim() } },
    ];
  }
  if (status) where.orderStatus = status;
  if (payment) where.paymentStatus = payment;

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      total: true,
      orderStatus: true,
      paymentStatus: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Заказы
      </h1>

      {/* ── Filters ── */}
      <form method="get" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Номер, имя, почта, телефон"
            aria-label="Поиск заказов"
            className="w-full rounded-xl border border-cream-300 bg-white py-2.5 pl-10 pr-3 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <select
          name="status"
          defaultValue={status}
          aria-label="Статус заказа"
          className="rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Все статусы</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          name="payment"
          defaultValue={payment}
          aria-label="Статус оплаты"
          className="rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Любая оплата</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort}
            aria-label="Сортировка"
            className="min-w-0 flex-1 rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
          >
            Найти
          </button>
        </div>
      </form>

      {/* ── Results ── */}
      {orders.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-[15px] text-brown shadow-soft">
          {q || status || payment
            ? "По этому запросу заказов не найдено."
            : "Заказов пока нет."}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-brown-400">Найдено: {orders.length}</p>

          {/* Cards on narrow screens, a table from md up — the table would be
              unreadable on a phone. */}
          <ul className="mt-3 flex flex-col gap-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-brown-dark">
                      {o.orderNumber}
                    </span>
                    <span
                      className={`badge ${ORDER_STATUS_TONE[o.orderStatus as OrderStatus]}`}
                    >
                      {ORDER_STATUS_LABELS[o.orderStatus as OrderStatus]}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[15px] text-brown">
                    {o.customerName}
                  </p>
                  <p className="truncate text-sm text-brown-400">{o.customerEmail}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-brown-400">
                      {o.createdAt.toLocaleDateString("ru-RU")} ·{" "}
                      {PAYMENT_STATUS_LABELS[o.paymentStatus as PaymentStatus]}
                    </span>
                    <span className="font-display font-extrabold text-brown-dark">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-cream-200 text-brown-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Номер</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Клиент</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Дата</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Статус</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Оплата</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-500 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <span className="block truncate text-brown-dark">
                        {o.customerName}
                      </span>
                      <span className="block truncate text-xs text-brown-400">
                        {o.customerEmail}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-brown">
                      {o.createdAt.toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`badge ${ORDER_STATUS_TONE[o.orderStatus as OrderStatus]}`}
                      >
                        {ORDER_STATUS_LABELS[o.orderStatus as OrderStatus]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-brown">
                      {PAYMENT_STATUS_LABELS[o.paymentStatus as PaymentStatus]}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-brown-dark">
                      {formatPrice(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
