import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import Image from "next/image";
import { Package, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import VerifyEmailBanner from "@/components/account/VerifyEmailBanner";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill, formatAmount } from "@/i18n/format";
import { ORDER_STATUS_TONE, type OrderStatus } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return {
    title: t.account.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = (await getCurrentUser())!;

  // Every query is filtered by the session's own user id.
  const [orderCount, recent, account] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        total: true,
        currency: true,
        orderStatus: true,
      },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        {fill(t.account.greeting, { name: user.name.split(" ")[0] ?? "" })}
      </h1>
      <p className="mt-2 text-[15px] text-brown">{user.email}</p>

      {!account?.emailVerified && (
        <div className="mt-6">
          <VerifyEmailBanner email={user.email} />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-4xl bg-white p-6 shadow-soft">
          <p className="text-sm text-brown-400">{t.account.ordersTotal}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-brown-dark">
            {orderCount}
          </p>
        </div>
        <Link
          href="/catalog"
          className="group flex flex-col justify-between rounded-4xl bg-brand-50 p-6 transition-colors hover:bg-brand-100"
        >
          <p className="text-[15px] font-semibold text-brown-dark">
            {t.account.createBook}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[15px] font-bold text-brand-500">
            {t.account.toCatalog}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-extrabold text-brown-dark">
            {t.account.recentOrders}
          </h2>
          {orderCount > 0 && (
            <Link
              href="/account/orders"
              className="text-[15px] font-bold text-brand-500 underline-offset-4 hover:underline"
            >
              {t.account.allOrders}
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="mt-5 rounded-4xl bg-white p-8 text-center shadow-soft">
            <Image
              src="/images/mascots/mascot-1.png"
              alt=""
              aria-hidden="true"
              width={420}
              height={420}
              className="mx-auto h-32 w-auto object-contain"
            />
            <p className="mt-3 font-display text-lg font-extrabold text-brown-dark">
              {t.account.noOrders}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-brown">
{t.account.noOrdersLead}
            </p>
            <Link href="/catalog" className="btn-primary mt-6">
              {t.account.chooseBook}
            </Link>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl bg-white p-5 shadow-soft transition-shadow hover:shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-brand-500">
                    <Package className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-brown-dark">
                      {order.orderNumber}
                    </span>
                    <span className="block text-sm text-brown-400">
                      {order.createdAt.toLocaleDateString("ru-RU")}
                    </span>
                  </span>
                  <span
                    className={`badge ${ORDER_STATUS_TONE[order.orderStatus as OrderStatus]}`}
                  >
                    {t.orderStatus[order.orderStatus as OrderStatus]}
                  </span>
                  <span className="font-display font-extrabold text-brown-dark">
                    {formatAmount(order.total, order.currency, locale)}
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
