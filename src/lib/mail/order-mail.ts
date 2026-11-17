import "server-only";

import { db } from "@/lib/db";
import {
  sendEmail,
  absoluteUrl,
  orderCreatedTemplate,
  orderStatusTemplate,
} from "@/lib/mail";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { type OrderStatus } from "@/lib/constants";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localeFromSegment } from "@/i18n/market";

/**
 * Transactional order mail.
 *
 * Separate from the order action so both the checkout flow and the admin panel
 * can trigger it, and so a mail failure is always a caught, logged side effect
 * rather than something that can roll back an order.
 */

/** Wording that matches what actually happened to the money. */
function paymentNote(paymentStatus: string, locale: Locale): string {
  const t = getDictionary(locale).mail;
  if (paymentStatus === "paid") return t.paymentPaid;
  if (isOnlinePaymentEnabled()) return t.paymentOnlinePending;
  return t.paymentManual;
}

export async function sendOrderCreatedEmail(orderId: string): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      total: true,
      currency: true,
      // The language the customer was reading when they ordered. A
      // confirmation in a language they cannot read is not a confirmation.
      locale: true,
      paymentStatus: true,
      items: {
        select: {
          productTitle: true,
          quantity: true,
          lineTotal: true,
          personalization: { select: { childName: true } },
        },
      },
    },
  });

  if (!order) return false;

  const locale = localeFromSegment(order.locale);

  const result = await sendEmail(
    order.customerEmail,
    "order_created",
    orderCreatedTemplate({
      locale,
      currency: order.currency,
      name: order.customerName.split(" ")[0] || order.customerName,
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        title: i.productTitle,
        childName: i.personalization?.childName ?? "—",
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      total: order.total,
      orderUrl: absoluteUrl("/account/orders", locale),
      paymentNote: paymentNote(order.paymentStatus, locale),
    })
  );

  return result.ok;
}

/**
 * Tells the customer their order moved.
 *
 * A completed order gets a review invitation instead of a plain link, which is
 * the only moment we ask — the customer now has the book in their hands.
 */
export async function sendOrderStatusEmail(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      locale: true,
    },
  });

  if (!order) return false;

  const locale = localeFromSegment(order.locale);

  const result = await sendEmail(
    order.customerEmail,
    "order_status",
    orderStatusTemplate({
      locale,
      name: order.customerName.split(" ")[0] || order.customerName,
      orderNumber: order.orderNumber,
      status,
      orderUrl: absoluteUrl(`/account/orders/${order.id}`, locale),
      reviewUrl:
        status === "completed"
          ? absoluteUrl(`/account/orders/${order.id}#review`, locale)
          : undefined,
    })
  );

  return result.ok;
}
