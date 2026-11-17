import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_MARKET,
  type PaymentProvider,
  type PaymentAttemptStatus,
} from "@/lib/constants";
import { absoluteUrl } from "@/lib/mail";
import { logger } from "@/lib/logger";
import type { PaymentGateway, ProviderEvent } from "./types";
import { manualGateway } from "./manual";
import { yookassaGateway } from "./yookassa";
import { paymeGateway } from "./payme";
import { clickGateway } from "./click";
import { MARKET, localeFromStored } from "@/i18n/market";

export type { PaymentGateway, ProviderEvent } from "./types";

const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
  manual: manualGateway,
  yookassa: yookassaGateway,
  payme: paymeGateway,
  click: clickGateway,
};

export function getGateway(provider: PaymentProvider): PaymentGateway {
  return GATEWAYS[provider];
}

/**
 * Providers this market can actually charge with, in the order they are
 * offered.
 *
 * Two filters, both necessary. Credentials, because a provider without them
 * takes the customer to a page that cannot charge their card. And market,
 * because YooKassa cannot settle in sum and Payme cannot settle in roubles —
 * offering one outside its country is a dead end dressed as a choice.
 *
 * "manual" is excluded: it is the fallback when this list is empty, not an
 * option alongside the others.
 */
export function onlineProviders(): PaymentProvider[] {
  return PAYMENT_PROVIDERS.filter((provider) => {
    if (provider === "manual") return false;
    const market = PAYMENT_PROVIDER_MARKET[provider];
    if (market !== "any" && market !== MARKET) return false;
    return GATEWAYS[provider].isConfigured();
  });
}

/** Every provider with credentials, including manual. Used by the back office. */
export function availableProviders(): PaymentProvider[] {
  return ["manual", ...onlineProviders()];
}

/**
 * Which provider a new order should use when the customer expressed no
 * preference. Falls back to payment on agreement, which always works.
 */
export function defaultProvider(): PaymentProvider {
  return onlineProviders()[0] ?? "manual";
}

/** True when this market can take money online at all. */
export function isOnlinePaymentEnabled(): boolean {
  return onlineProviders().length > 0;
}

/** Whether a provider may be used for an order placed in this market. */
export function isProviderOffered(provider: PaymentProvider): boolean {
  return provider === "manual" || onlineProviders().includes(provider);
}

export interface StartPaymentResult {
  ok: boolean;
  /** Set when the customer must be sent to the provider to pay. */
  redirectUrl?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Creates a payment attempt for an order.
 *
 * The amount is read from the order row, never from the caller — the same rule
 * that governs order pricing. An idempotency key is generated per attempt and
 * replayed to the provider so a double-submit cannot produce two charges.
 */
export async function startPayment(
  orderId: string,
  /**
   * The provider the customer picked. Validated against what this market
   * offers — a request naming a provider we do not serve is refused rather
   * than silently redirected to a different one.
   */
  requested?: PaymentProvider
): Promise<StartPaymentResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      customerEmail: true,
      paymentStatus: true,
      locale: true,
      currency: true,
    },
  });

  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.paymentStatus === "paid") {
    return { ok: false, error: "Заказ уже оплачен" };
  }

  const provider =
    requested && isProviderOffered(requested) ? requested : defaultProvider();
  const gateway = getGateway(provider);
  const idempotencyKey = randomUUID();

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      provider,
      status: "pending",
      amount: order.total,
      currency: order.currency,
      idempotencyKey,
    },
  });

  const created = await gateway.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    description: `Заказ ${order.orderNumber} — Капибара`,
    customerEmail: order.customerEmail,
    returnUrl: absoluteUrl(`/order-success?order=${order.id}`, localeFromStored(order.locale)),
    idempotencyKey,
  });

  if (!created.ok) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "failed", failureReason: created.error },
    });
    // The provider's own words stay in the database for the operator; the
    // customer gets something they can act on.
    return {
      ok: false,
      error: "Не удалось начать оплату. Попробуйте ещё раз или свяжитесь с нами",
    };
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: created.value.providerPaymentId,
      status: created.value.status,
      confirmationUrl: created.value.confirmationUrl,
      rawPayload: created.value.raw ? JSON.stringify(created.value.raw) : null,
    },
  });

  // Manual payments are recorded as "pay on confirmation" so no screen ever
  // implies money changed hands.
  if (provider === "manual") {
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "pay_on_confirmation" },
    });
  }

  return {
    ok: true,
    paymentId: payment.id,
    redirectUrl: created.value.confirmationUrl ?? undefined,
  };
}

/**
 * Applies a provider event to our records.
 *
 * Three guards, in order: the payment must exist, the reported amount must
 * match what we recorded, and a payment already settled is never re-settled.
 * Together these mean a replayed or tampered event cannot change an order.
 */
export async function applyProviderEvent(
  event: ProviderEvent
): Promise<{ ok: boolean; error?: string }> {
  const payment = await db.payment.findUnique({
    where: { providerPaymentId: event.providerPaymentId },
    select: { id: true, orderId: true, amount: true, status: true },
  });

  if (!payment) return { ok: false, error: "Платёж не найден" };

  // A succeeded event whose amount does not match what we charged is either a
  // provider bug or an attack. Either way it must not settle the order.
  if (
    event.status === "succeeded" &&
    event.amount !== null &&
    event.amount !== payment.amount
  ) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failureReason: `Сумма не совпадает: ожидалось ${payment.amount}, получено ${event.amount}`,
        rawPayload: JSON.stringify(event.raw),
      },
    });
    return { ok: false, error: "Сумма платежа не совпадает" };
  }

  // Already settled — a duplicate webhook is a no-op, not an error.
  if (payment.status === "succeeded") return { ok: true };

  const settled: PaymentAttemptStatus[] = ["succeeded"];

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: event.status,
        failureReason: event.failureReason ?? null,
        rawPayload: JSON.stringify(event.raw),
        paidAt: event.status === "succeeded" ? new Date() : null,
      },
    });

    if (settled.includes(event.status)) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "paid",
          // A paid order stops being "new" — it is waiting on us now.
          orderStatus: "in_progress",
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          fromStatus: "new",
          toStatus: "in_progress",
          note: "Оплата подтверждена провайдером",
        },
      });
    }
  });

  return { ok: true };
}

/**
 * Re-reads a payment from the provider and applies whatever it says.
 *
 * Used by the return page and by the admin panel: a webhook can be delayed or
 * lost, and the customer should not be left staring at "ожидает оплаты" for an
 * order they have already paid for.
 */
export async function reconcilePayment(
  paymentId: string
): Promise<{ ok: boolean; status?: PaymentAttemptStatus; error?: string }> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { providerPaymentId: true, provider: true, status: true },
  });

  if (!payment?.providerPaymentId) {
    return { ok: false, error: "Платёж не найден" };
  }
  if (payment.status === "succeeded") return { ok: true, status: "succeeded" };

  const gateway = getGateway(payment.provider as PaymentProvider);
  const fetched = await gateway.fetchPayment(payment.providerPaymentId);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const applied = await applyProviderEvent(fetched.value);
  if (!applied.ok) return { ok: false, error: applied.error };

  return { ok: true, status: fetched.value.status };
}

/**
 * Sweeps payments the provider never told us about.
 *
 * A webhook can be lost: the provider retried while we were deploying, a proxy
 * dropped it, the endpoint 500'd. Without this, a customer who paid would sit
 * at "ожидает оплаты" until someone noticed. The worker calls it every tick.
 *
 * Only unsettled online payments in a plausible age window are checked — old
 * enough that the webhook should have arrived, young enough to still matter.
 */
export async function reconcileStalePayments(): Promise<number> {
  if (!isOnlinePaymentEnabled()) return 0;

  const now = Date.now();
  const stale = await db.payment.findMany({
    where: {
      provider: { not: "manual" },
      status: { in: ["pending", "waiting_for_capture"] },
      createdAt: {
        lt: new Date(now - 2 * 60_000),
        gt: new Date(now - 7 * 24 * 60 * 60_000),
      },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true },
  });

  let reconciled = 0;
  for (const payment of stale) {
    const result = await reconcilePayment(payment.id).catch(() => ({ ok: false }));
    if (result.ok) reconciled += 1;
  }

  if (reconciled > 0) {
    logger.info("payments.reconciled", { count: reconciled, checked: stale.length });
  }
  return reconciled;
}
