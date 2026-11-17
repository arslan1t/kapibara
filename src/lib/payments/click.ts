import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type {
  CreatePaymentInput,
  CreatedPayment,
  PaymentGateway,
  ProviderEvent,
  ProviderResult,
} from "./types";

/**
 * Click SHOP API.
 *
 * Two calls, in order: Prepare, which asks whether an order can be paid and
 * gets back an id we invent, and Complete, which quotes that id back and says
 * whether the money moved. Both arrive as form-encoded POSTs signed with an
 * MD5 of the fields plus the secret key — MD5 because that is what Click
 * specifies; it is a shared-secret check, not a password hash.
 *
 * Amounts are in sum, with decimals, unlike Payme's tiyin. The two providers
 * disagree about this and both are in the same market, which is exactly the
 * sort of thing that produces a hundredfold error, so each conversion lives in
 * its own file and neither is shared.
 *
 * NOT YET VERIFIED AGAINST THE LIVE PROVIDER. Written from Click's published
 * SHOP API specification; no request has been made with real credentials,
 * because there are none yet. It must be run through Click's test merchant
 * before the Uzbek site takes a real payment.
 */

const CHECKOUT_URL = "https://my.click.uz/services/pay";

export const CLICK_ACTION = { prepare: 0, complete: 1 } as const;

/** Click's own error vocabulary. 0 is success; everything else is refusal. */
export const CLICK_ERRORS = {
  ok: 0,
  signCheckFailed: -1,
  incorrectAmount: -2,
  actionNotFound: -3,
  alreadyPaid: -4,
  userNotFound: -5,
  transactionNotFound: -6,
  failedToUpdate: -7,
  requestError: -8,
  transactionCancelled: -9,
} as const;

function config() {
  const serviceId = process.env.CLICK_SERVICE_ID?.trim();
  const merchantId = process.env.CLICK_MERCHANT_ID?.trim();
  const secretKey = process.env.CLICK_SECRET_KEY?.trim();
  const merchantUserId = process.env.CLICK_MERCHANT_USER_ID?.trim();
  return {
    serviceId,
    merchantId,
    secretKey,
    merchantUserId,
    configured: Boolean(serviceId && merchantId && secretKey),
  };
}

export interface ClickCallback {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  error: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

/**
 * The signature Click sends.
 *
 * The field order is fixed by the specification and must not be sorted or
 * tidied: md5 of click_trans_id + service_id + secret + merchant_trans_id +
 * (merchant_prepare_id, on Complete only) + amount + action + sign_time.
 */
export function clickSignature(
  params: ClickCallback,
  secretKey: string
): string {
  const isComplete = Number(params.action) === CLICK_ACTION.complete;
  const parts = [
    params.click_trans_id,
    params.service_id,
    secretKey,
    params.merchant_trans_id,
    ...(isComplete ? [params.merchant_prepare_id ?? ""] : []),
    params.amount,
    params.action,
    params.sign_time,
  ];
  return createHash("md5").update(parts.join(""), "utf8").digest("hex");
}

export function verifyClickSignature(
  params: ClickCallback,
  secretKey: string
): boolean {
  const expected = clickSignature(params, secretKey);
  const given = (params.sign_string ?? "").toLowerCase();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/**
 * Click sends the amount as a decimal string. The order is in whole sum, and
 * fractional sum do not exist in this shop, so anything with a real fraction
 * is a mismatch rather than a rounding question.
 */
export function amountMatches(given: string, expected: number): boolean {
  const parsed = Number.parseFloat(given);
  if (!Number.isFinite(parsed)) return false;
  return Math.abs(parsed - expected) < 0.005;
}

interface ClickState {
  clickTransId: string;
  prepareId: string;
  preparedAt: number;
  completedAt: number;
}

function readState(raw: string | null): ClickState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ClickState>;
    if (typeof parsed.clickTransId !== "string") return null;
    return {
      clickTransId: parsed.clickTransId,
      prepareId: String(parsed.prepareId ?? ""),
      preparedAt: Number(parsed.preparedAt ?? 0),
      completedAt: Number(parsed.completedAt ?? 0),
    };
  } catch {
    return null;
  }
}

export interface ClickResponse {
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  merchant_confirm_id?: string;
  error: number;
  error_note: string;
}

const NOTES: Record<number, string> = {
  [CLICK_ERRORS.ok]: "Success",
  [CLICK_ERRORS.signCheckFailed]: "SIGN CHECK FAILED",
  [CLICK_ERRORS.incorrectAmount]: "Incorrect parameter amount",
  [CLICK_ERRORS.actionNotFound]: "Action not found",
  [CLICK_ERRORS.alreadyPaid]: "Already paid",
  [CLICK_ERRORS.userNotFound]: "User does not exist",
  [CLICK_ERRORS.transactionNotFound]: "Transaction does not exist",
  [CLICK_ERRORS.failedToUpdate]: "Failed to update user",
  [CLICK_ERRORS.requestError]: "Error in request from click",
  [CLICK_ERRORS.transactionCancelled]: "Transaction cancelled",
};

function refuse(params: ClickCallback, error: number): ClickResponse {
  return {
    click_trans_id: params.click_trans_id ?? "",
    merchant_trans_id: params.merchant_trans_id ?? "",
    error,
    error_note: NOTES[error] ?? "Error",
  };
}

/**
 * Prepare: can this order be paid, and under what id.
 *
 * Exported so the route is thin and the protocol is testable without a server.
 */
export async function handleClickPrepare(
  params: ClickCallback
): Promise<ClickResponse> {
  const { secretKey, serviceId, configured } = config();
  if (!configured) return refuse(params, CLICK_ERRORS.requestError);
  if (params.service_id !== serviceId) {
    return refuse(params, CLICK_ERRORS.requestError);
  }
  if (!verifyClickSignature(params, secretKey!)) {
    return refuse(params, CLICK_ERRORS.signCheckFailed);
  }
  if (Number(params.action) !== CLICK_ACTION.prepare) {
    return refuse(params, CLICK_ERRORS.actionNotFound);
  }

  const order = await db.order.findUnique({
    where: { id: params.merchant_trans_id },
    select: {
      id: true,
      total: true,
      currency: true,
      region: true,
      paymentStatus: true,
      orderStatus: true,
    },
  });

  if (!order) return refuse(params, CLICK_ERRORS.userNotFound);
  // A Russian order cannot be paid through an Uzbek provider, whatever the
  // request claims.
  if (order.region !== "UZ" || order.currency !== "UZS") {
    return refuse(params, CLICK_ERRORS.userNotFound);
  }
  if (order.orderStatus === "cancelled") {
    return refuse(params, CLICK_ERRORS.transactionCancelled);
  }
  if (order.paymentStatus === "paid") {
    return refuse(params, CLICK_ERRORS.alreadyPaid);
  }
  if (!amountMatches(params.amount, order.total)) {
    return refuse(params, CLICK_ERRORS.incorrectAmount);
  }

  // Our own id for this attempt, quoted back to us on Complete. Click requires
  // an integer, and milliseconds are unique enough for one order's attempts.
  const prepareId = String(Date.now());
  const state: ClickState = {
    clickTransId: params.click_trans_id,
    prepareId,
    preparedAt: Date.now(),
    completedAt: 0,
  };

  const attachable = await db.payment.findFirst({
    where: {
      orderId: order.id,
      provider: "click",
      providerPaymentId: null,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (attachable) {
    await db.payment.update({
      where: { id: attachable.id },
      data: {
        providerPaymentId: params.click_trans_id,
        providerState: JSON.stringify(state),
        amount: order.total,
        currency: order.currency,
      },
    });
  } else {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "click",
        providerPaymentId: params.click_trans_id,
        providerState: JSON.stringify(state),
        status: "pending",
        amount: order.total,
        currency: order.currency,
        idempotencyKey: `click:${params.click_trans_id}`,
      },
    });
  }

  logger.info("click.prepared", { orderId: order.id });

  return {
    click_trans_id: params.click_trans_id,
    merchant_trans_id: order.id,
    merchant_prepare_id: prepareId,
    error: CLICK_ERRORS.ok,
    error_note: NOTES[CLICK_ERRORS.ok]!,
  };
}

/** Complete: the money moved, or it did not. */
export async function handleClickComplete(
  params: ClickCallback
): Promise<ClickResponse> {
  const { secretKey, serviceId, configured } = config();
  if (!configured) return refuse(params, CLICK_ERRORS.requestError);
  if (params.service_id !== serviceId) {
    return refuse(params, CLICK_ERRORS.requestError);
  }
  if (!verifyClickSignature(params, secretKey!)) {
    return refuse(params, CLICK_ERRORS.signCheckFailed);
  }
  if (Number(params.action) !== CLICK_ACTION.complete) {
    return refuse(params, CLICK_ERRORS.actionNotFound);
  }

  const payment = await db.payment.findUnique({
    where: { providerPaymentId: params.click_trans_id },
    select: {
      id: true,
      orderId: true,
      amount: true,
      status: true,
      providerState: true,
    },
  });
  const state = readState(payment?.providerState ?? null);

  if (!payment || !state) {
    return refuse(params, CLICK_ERRORS.transactionNotFound);
  }
  // The prepare id is the only thing tying this call to the Prepare we
  // answered. A mismatch means the pair does not belong together.
  if (state.prepareId !== String(params.merchant_prepare_id ?? "")) {
    return refuse(params, CLICK_ERRORS.transactionNotFound);
  }
  if (payment.status === "succeeded") {
    // Click retries; the second answer must match the first.
    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: payment.orderId,
      merchant_confirm_id: state.prepareId,
      error: CLICK_ERRORS.ok,
      error_note: NOTES[CLICK_ERRORS.ok]!,
    };
  }
  if (!amountMatches(params.amount, payment.amount)) {
    return refuse(params, CLICK_ERRORS.incorrectAmount);
  }

  // A negative `error` from Click means the payment failed on their side.
  const providerError = Number(params.error ?? 0);
  if (providerError < 0) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "canceled",
        failureReason: `Click: ${params.error_note ?? providerError}`,
        providerState: JSON.stringify({ ...state, completedAt: Date.now() }),
      },
    });
    logger.info("click.cancelled", {
      orderId: payment.orderId,
      code: providerError,
    });
    return refuse(params, CLICK_ERRORS.transactionCancelled);
  }

  const completedAt = Date.now();

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        paidAt: new Date(completedAt),
        providerState: JSON.stringify({ ...state, completedAt }),
      },
    });
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "paid" },
    });
  });

  logger.info("click.completed", {
    orderId: payment.orderId,
    paymentId: payment.id,
  });

  return {
    click_trans_id: params.click_trans_id,
    merchant_trans_id: payment.orderId,
    merchant_confirm_id: state.prepareId,
    error: CLICK_ERRORS.ok,
    error_note: NOTES[CLICK_ERRORS.ok]!,
  };
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

export const clickGateway: PaymentGateway = {
  id: "click",

  isConfigured() {
    return config().configured;
  },

  /** Builds the checkout link. Click, like Payme, is called rather than calling. */
  async createPayment(
    input: CreatePaymentInput
  ): Promise<ProviderResult<CreatedPayment>> {
    const { serviceId, merchantId, configured } = config();
    if (!configured) return { ok: false, error: "Click не настроен" };

    const url = new URL(CHECKOUT_URL);
    url.searchParams.set("service_id", serviceId!);
    url.searchParams.set("merchant_id", merchantId!);
    url.searchParams.set("amount", String(input.amount));
    url.searchParams.set("transaction_param", input.orderId);
    url.searchParams.set("return_url", input.returnUrl);

    return {
      ok: true,
      value: {
        // Click mints its transaction id when it calls Prepare.
        providerPaymentId: null,
        status: "pending",
        confirmationUrl: url.toString(),
      },
    };
  },

  async parseWebhook(): Promise<ProviderResult<ProviderEvent>> {
    return {
      ok: false,
      error: "Click использует Prepare/Complete, а не webhook",
    };
  },

  async fetchPayment(
    providerPaymentId: string
  ): Promise<ProviderResult<ProviderEvent>> {
    const payment = await db.payment.findUnique({
      where: { providerPaymentId },
      select: { amount: true, status: true, providerState: true },
    });
    if (!payment) return { ok: false, error: "Транзакция не найдена" };

    return {
      ok: true,
      value: {
        providerPaymentId,
        status: payment.status as ProviderEvent["status"],
        amount: payment.amount,
        raw: readState(payment.providerState),
      },
    };
  },
};
