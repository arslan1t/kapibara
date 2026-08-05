import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Mail,
  ArrowRight,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { reconcilePayment } from "@/lib/payments";
import { isMailConfigured } from "@/lib/mail";
import { formatPrice } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { readOrderClaim, claimMatches } from "@/lib/claim";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Заказ оформлен",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

/**
 * Confirmation screen.
 *
 * Reads the order's real payment state rather than assuming success. When the
 * customer arrives back from a provider the latest payment is reconciled first,
 * because the webhook may not have landed yet — otherwise someone who has just
 * paid would be told their order is unpaid.
 *
 * Access is proven, not assumed. The order id in the URL is not a credential:
 * the viewer must either be the account that owns the order, or hold the
 * httpOnly claim cookie issued when the order was placed. Anyone else sees a
 * neutral page with no order details — this page carries an email address and
 * an amount, and neither belongs to a stranger who guessed an id.
 */
export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;

  const [user, presentedClaim] = await Promise.all([
    getCurrentUser(),
    readOrderClaim(),
  ]);

  const record = orderId
    ? await db.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          total: true,
          paymentStatus: true,
          customerEmail: true,
          userId: true,
          guestClaimToken: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true, provider: true },
          },
        },
      })
    : null;

  const entitled =
    Boolean(record) &&
    ((user && record!.userId === user.id) ||
      claimMatches(record!.guestClaimToken, presentedClaim));

  if (record && !entitled) {
    // Logged without the order id: a probe should leave a trace, but the trace
    // must not become a second copy of the thing being probed.
    logger.warn("order_success.denied", { hasSession: Boolean(user) });
  }

  const order = entitled ? record : null;
  const latest = order?.payments[0];

  // Ask the provider directly; a lost or delayed webhook must not leave the
  // customer looking at a stale status.
  if (latest && latest.provider !== "manual" && latest.status !== "succeeded") {
    await reconcilePayment(latest.id).catch(() => {});
  }

  const fresh =
    entitled && orderId
      ? await db.order.findUnique({
          where: { id: orderId },
          select: { paymentStatus: true },
        })
      : null;

  const paymentStatus = fresh?.paymentStatus ?? order?.paymentStatus ?? null;
  const paid = paymentStatus === "paid";
  const awaitingOnline = paymentStatus === "unpaid" && latest?.provider !== "manual";

  return (
    <div className="py-16 md:py-24">
      <div className="page-container mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              awaitingOnline ? "bg-gold-100" : "bg-sage-100"
            }`}
          >
            {awaitingOnline ? (
              <Clock className="h-10 w-10 text-brown-dark" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-sage-500" aria-hidden="true" />
            )}
          </div>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-brown-dark md:text-4xl">
          {awaitingOnline ? "Заказ создан, ждём оплату" : "Заказ оформлен"}
        </h1>

        {order ? (
          <p className="mt-4 leading-relaxed text-brown">
            Номер заказа{" "}
            <span className="font-semibold text-brown-dark">{order.orderNumber}</span>
            {" · "}
            {formatPrice(order.total)}
          </p>
        ) : (
          <p className="mt-4 leading-relaxed text-brown">
            Спасибо за заказ. Детали доступны в личном кабинете.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-cream-100 p-6">
          {/* ── Payment ── */}
          <div className="flex items-start gap-3 text-left">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                paid ? "bg-sage-100" : "bg-gold-100"
              }`}
            >
              {paid ? (
                <CheckCircle2 className="h-5 w-5 text-sage-500" aria-hidden="true" />
              ) : awaitingOnline ? (
                <CreditCard className="h-5 w-5 text-brown-dark" aria-hidden="true" />
              ) : (
                <Clock className="h-5 w-5 text-brown-dark" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-dark">Оплата</p>
              <p className="text-[13px] leading-relaxed text-brown">
                {paid
                  ? "Оплата получена."
                  : awaitingOnline
                    ? "Оплата ещё не поступила. Если вы её отменили, свяжитесь с нами — мы поможем оплатить заказ."
                    : "Оплата после подтверждения заказа — мы свяжемся с вами по телефону."}
              </p>
            </div>
          </div>

          {/* ── What happens next ── */}
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Package className="h-5 w-5 text-brand-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-dark">Что дальше</p>
              <p className="text-[13px] leading-relaxed text-brown">
                Мы подтвердим заказ, добавим имя и фотографию в иллюстрации и
                отправим книгу в печать. Статус виден в личном кабинете.
              </p>
            </div>
          </div>

          {/* ── Email ── */}
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-300">
              <Mail className="h-5 w-5 text-brown-dark" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-dark">Письмо</p>
              <p className="text-[13px] leading-relaxed text-brown">
                {isMailConfigured()
                  ? `Мы отправили подтверждение${order ? ` на ${order.customerEmail}` : ""}.`
                  : "Отправка писем ещё не настроена — следите за статусом в личном кабинете."}
              </p>
            </div>
          </div>
        </div>

        {awaitingOnline && (
          <div
            role="status"
            className="mt-6 flex items-start gap-2.5 rounded-2xl bg-gold-100 p-4 text-left text-[13px] leading-relaxed text-brown-dark"
          >
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Заказ сохранён и не потеряется. Мы придержим его и свяжемся с вами,
              если оплата не поступит.
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/orders" className="btn-primary flex items-center gap-2">
            Мои заказы
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/catalog" className="btn-secondary">
            Продолжить покупки
          </Link>
        </div>
      </div>
    </div>
  );
}
