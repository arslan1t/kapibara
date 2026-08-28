"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isChildNameValid, sanitizeChildName } from "@/lib/validation";
import { isPurchasable, isDeliveryMethod } from "@/lib/constants";
import { startPayment } from "@/lib/payments";
import { rateLimit, rateLimitMessage, clientIp } from "@/lib/rate-limit";
import { sendOrderCreatedEmail } from "@/lib/mail/order-mail";
import { issueOrderClaim, readJobClaim } from "@/lib/claim";
import { getJobForUser } from "@/lib/generation";
import { logger } from "@/lib/logger";

export type CheckoutItem = {
  productSlug: string;
  quantity: number;
  personalization: {
    childName: string;
    childGender?: string | null;
    childAge?: number | null;
    dedication?: string | null;
    photoKey?: string | null;
    /** Preview job whose result becomes this line's approved cover. */
    generationJobId?: string | null;
  };
};

export type CreateOrderInput = {
  /**
   * Client-generated key that makes this call idempotent.
   *
   * A double-click, a retried request after a dropped connection, or a refresh
   * of a form re-post all replay the same key, and all get back the original
   * order instead of creating a second one.
   */
  idempotencyKey?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress: string;
  customerComment?: string;
  items: CheckoutItem[];
};

export type CreateOrderResult =
  | {
      ok: true;
      orderNumber: string;
      orderId: string;
      /** Set when an online provider needs the customer to finish paying. */
      paymentUrl?: string;
    }
  | { ok: false; error: string };

/**
 * KPB-2026-0001, from a PostgreSQL sequence.
 *
 * Previously this read the highest existing number and added one, which two
 * simultaneous checkouts could both execute before either inserted — handing
 * out the same number and failing one order on the unique index. `nextval` is
 * atomic and never returns the same value twice, even under concurrency.
 */
async function nextOrderNumber(): Promise<string> {
  const rows = await db.$queryRaw<{ n: string }[]>`SELECT next_order_number() AS n`;
  return rows[0]!.n;
}

/**
 * Links each preview the customer approved to the order line it was approved
 * for, by filling in the job's `orderItemId`.
 *
 * Ownership is re-checked here rather than trusted from the browser: a job id
 * is not a secret, and without the check anyone could attach another child's
 * artwork to their own order and then read it through the order's own routes.
 *
 * A job that cannot be verified is skipped. The order is already placed and
 * valid, and the cover remains recoverable by regenerating from the stored
 * photograph — which is what an administrator did for every order before this
 * link existed.
 */
async function attachApprovedCovers(
  orderId: string,
  items: { id: string; productSlug: string }[],
  lines: { productSlug: string; personalization: CheckoutItem["personalization"] }[],
  userId: string | undefined
): Promise<void> {
  const presentedClaim = await readJobClaim();

  for (const [index, line] of lines.entries()) {
    const jobId = line.personalization?.generationJobId;
    if (!jobId) continue;

    const item = items[index];
    if (!item || item.productSlug !== line.productSlug) continue;

    try {
      const job = await getJobForUser(jobId, userId ?? null, presentedClaim);
      // Only a finished job carries a cover.
      if (!job || job.status !== "succeeded") continue;

      // `orderItemId: null` in the predicate: a job already bound to another
      // line must never be moved onto this one.
      await db.generationJob.updateMany({
        where: { id: jobId, orderItemId: null },
        data: { orderItemId: item.id },
      });
    } catch (error) {
      logger.warn("order.cover_link_failed", {
        orderId,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

/**
 * Creates a real order.
 *
 * Prices are never taken from the request. Each line is priced from the
 * product row, and any product that is not currently purchasable aborts the
 * whole order, so an edited client payload cannot buy an unreleased book or
 * set its own price.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const user = await getCurrentUser();

  const customerName = input.customerName?.trim() ?? "";
  const customerEmail = input.customerEmail?.trim().toLowerCase() ?? "";
  const customerPhone = input.customerPhone?.trim() ?? "";
  const deliveryAddress = input.deliveryAddress?.trim() ?? "";

  if (customerName.length < 2) return { ok: false, error: "Укажите имя получателя" };
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(customerEmail)) {
    return { ok: false, error: "Введите корректный адрес электронной почты" };
  }
  if (customerPhone.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Введите корректный номер телефона" };
  }
  if (!isDeliveryMethod(input.deliveryMethod)) {
    return { ok: false, error: "Выберите способ доставки" };
  }
  if (deliveryAddress.length < 5) {
    return { ok: false, error: "Укажите адрес доставки" };
  }
  if (!input.items?.length) {
    return { ok: false, error: "Корзина пуста" };
  }

  // Generous enough that a real customer never notices, tight enough that a
  // script cannot fill the order table.
  const limited = await rateLimit("checkout", `ip:${await clientIp()}`);
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter) };
  }

  // Idempotency, part one: a replayed key that already produced an order
  // returns that order. Part two is the unique index, which settles the race
  // when two identical requests arrive at the same moment (below).
  const idempotencyKey =
    typeof input.idempotencyKey === "string" &&
    /^[a-zA-Z0-9-]{16,64}$/.test(input.idempotencyKey)
      ? input.idempotencyKey
      : null;

  if (idempotencyKey) {
    const existing = await db.order.findUnique({
      where: { idempotencyKey },
      select: { id: true, orderNumber: true },
    });

    if (existing) {
      logger.info("order.idempotent_replay", { orderId: existing.id });
      return {
        ok: true,
        orderId: existing.id,
        orderNumber: existing.orderNumber,
      };
    }
  }

  // ── Re-price every line from the database ──
  const priced: {
    productId: string;
    productTitle: string;
    productSlug: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    personalization: CheckoutItem["personalization"];
  }[] = [];

  for (const item of input.items) {
    const product = await db.product.findUnique({
      where: { slug: item.productSlug },
    });

    if (!product) {
      return { ok: false, error: "Один из товаров больше недоступен" };
    }
    if (!isPurchasable(product)) {
      return {
        ok: false,
        error: `«${product.shortTitle}» пока нельзя заказать`,
      };
    }

    const quantity = Math.min(Math.max(Math.trunc(item.quantity) || 1, 1), 20);

    // The child's name is re-validated here; the browser check is only a
    // convenience and cannot be relied upon.
    const cleaned = sanitizeChildName(item.personalization?.childName ?? "");
    if (!isChildNameValid(cleaned.value)) {
      return {
        ok: false,
        error: "Имя ребёнка должно быть написано кириллицей",
      };
    }

    priced.push({
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
      personalization: {
        ...item.personalization,
        childName: cleaned.value.trim(),
      },
    });
  }

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryPrice = 0; // Calculated by the operator after confirmation.
  const total = subtotal + deliveryPrice;

  try {
    const orderNumber = await nextOrderNumber();

    // Issued before the insert so the cookie is set on this response. It lets
    // the browser that placed a guest order read its own confirmation page
    // without the order id alone being a credential.
    const guestClaimToken = await issueOrderClaim();

    const order = await db.order.create({
      data: {
        orderNumber,
        idempotencyKey,
        guestClaimToken,
        userId: user?.id ?? null,
        customerEmail,
        customerName,
        customerPhone,
        subtotal,
        deliveryPrice,
        total,
        // Starts unpaid in every case. `startPayment` below moves it to
        // "pay_on_confirmation" for the manual provider, and only a verified
        // provider event ever moves it to "paid".
        paymentStatus: "unpaid",
        orderStatus: "new",
        deliveryMethod: input.deliveryMethod,
        deliveryAddress,
        customerComment: input.customerComment?.trim() || null,
        items: {
          create: priced.map((line) => ({
            productId: line.productId,
            productTitle: line.productTitle,
            productSlug: line.productSlug,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
            personalization: {
              create: {
                childName: line.personalization.childName,
                childGender: line.personalization.childGender ?? null,
                childAge: line.personalization.childAge ?? null,
                dedication: line.personalization.dedication ?? null,
                photoKey: line.personalization.photoKey ?? null,
              },
            },
          })),
        },
        history: {
          create: { toStatus: "new", note: "Заказ создан на сайте" },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        items: { select: { id: true, productSlug: true } },
      },
    });

    // Attach the approved cover to the line it belongs to.
    //
    // Done after the order exists, and never inside its transaction: failing to
    // link artwork must not lose a paid order. If it does fail the order stands
    // and an administrator can regenerate from the photograph, which is exactly
    // what happened for every order before this existed.
    await attachApprovedCovers(order.id, order.items, priced, user?.id);

    // Opens a payment attempt. With an online provider configured this returns
    // a redirect URL; otherwise it records payment-on-confirmation.
    const payment = await startPayment(order.id);

    // The confirmation email is not worth failing a placed order over.
    void sendOrderCreatedEmail(order.id).catch(() => {});

    logger.info("order.created", {
      orderId: order.id,
      total,
      items: priced.length,
      signedIn: Boolean(user),
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentUrl: payment.redirectUrl,
    };
  } catch (error) {
    // Idempotency, part two: two identical requests raced and the other one
    // won the unique index. Return its order rather than an error — from the
    // customer's point of view their single click produced a single order.
    if (idempotencyKey) {
      const winner = await db.order.findUnique({
        where: { idempotencyKey },
        select: { id: true, orderNumber: true },
      });
      if (winner) {
        logger.info("order.idempotent_race", { orderId: winner.id });
        return { ok: true, orderId: winner.id, orderNumber: winner.orderNumber };
      }
    }

    logger.error("order.create_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      error: "Не удалось оформить заказ. Попробуйте ещё раз",
    };
  }
}
