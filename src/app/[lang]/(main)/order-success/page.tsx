import type { Metadata } from "next";
import Link from "@/i18n/navigation";
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
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill, formatAmount } from "@/i18n/format";
import { getCurrentUser } from "@/lib/auth";
import { readOrderClaim, claimMatches } from "@/lib/claim";
import { logger } from "@/lib/logger";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return { title: t.orderSuccess.metaTitle, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<LangParams>;
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
export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const locale = localeFromSegment((await params).lang);
  const t = getDictionary(locale);
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
          currency: true,
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
          {awaitingOnline
            ? t.orderSuccess.headingAwaiting
            : t.orderSuccess.headingPaid}
        </h1>

        {order ? (
          <p className="mt-4 leading-relaxed text-brown">
            {t.orderSuccess.orderNumber}{" "}
            <span className="font-semibold text-brown-dark">{order.orderNumber}</span>
            {" · "}
            {/* The currency the order was actually placed in, not the
                currency of whatever storefront is being read now. */}
            {formatAmount(order.total, order.currency, locale)}
          </p>
        ) : (
          <p className="mt-4 leading-relaxed text-brown">
            {t.orderSuccess.thanks}
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
              <p className="text-sm font-semibold text-brown-dark">{t.orderSuccess.paymentHeading}</p>
              <p className="text-[13px] leading-relaxed text-brown">
                {paid
                  ? t.orderSuccess.paymentPaid
                  : awaitingOnline
                    ? t.orderSuccess.paymentPending
                    : t.orderSuccess.paymentManual}
              </p>
            </div>
          </div>

          {/* ── What happens next ── */}
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Package className="h-5 w-5 text-brand-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-dark">{t.orderSuccess.nextHeading}</p>
              <p className="text-[13px] leading-relaxed text-brown">
{t.orderSuccess.nextBody}
              </p>
            </div>
          </div>

          {/* ── Email ── */}
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-300">
              <Mail className="h-5 w-5 text-brown-dark" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-dark">{t.orderSuccess.mailHeading}</p>
              <p className="text-[13px] leading-relaxed text-brown">
                {isMailConfigured()
                  ? fill(t.orderSuccess.mailSent, {
                      recipient: order ? ` — ${order.customerEmail}` : "",
                    })
                  : t.orderSuccess.mailNotConfigured}
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
{t.orderSuccess.keptNote}
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/orders" className="btn-primary flex items-center gap-2">
            {t.orderSuccess.myOrders}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/catalog" className="btn-secondary">
            {t.orderSuccess.keepShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}
