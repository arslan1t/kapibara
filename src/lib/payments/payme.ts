import "server-only";

import { timingSafeEqual } from "node:crypto";
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
 * Payme (Paycom) Merchant API.
 *
 * Nothing like YooKassa. There is no "create a payment" call: the customer is
 * sent to checkout.paycom.uz with the order encoded in the URL, and Payme then
 * drives a transaction by calling US — JSON-RPC, over the endpoint registered
 * in the merchant cabinet, with a state machine we are responsible for
 * remembering and answering questions about afterwards.
 *
 * Amounts are in tiyin. A sum is a hundred of them, and getting that wrong by
 * a factor of a hundred in either direction is the classic way to lose money
 * on this integration, so the conversion happens in exactly two places below
 * and nowhere else.
 *
 * Checked against developer.help.paycom.uz on 17.11.2026: the six methods, the
 * Basic authorization header, and the rule that every answer — including an
 * error — must carry HTTP 200, because Payme reads a non-200 as RPC error
 * -32400 rather than as the error we are trying to report.
 *
 * STILL NOT VERIFIED AGAINST THE LIVE PROVIDER. No request has been made with
 * real credentials, because there are none yet. It must be run through Payme's
 * sandbox from the merchant cabinet before the Uzbek site takes a real
 * payment.
 */

const CHECKOUT_URL = "https://checkout.paycom.uz";

/** Payme cancels a created-but-unperformed transaction after twelve hours. */
const TRANSACTION_TTL_MS = 12 * 60 * 60 * 1000;

/** The account field Payme is configured to send. Must match the cabinet. */
const ACCOUNT_FIELD = "order_id";

export const PAYME_ERRORS = {
  /** JSON-RPC transport and shape. */
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  insufficientPrivilege: -32504,
  /** Business. */
  wrongAmount: -31001,
  transactionNotFound: -31003,
  cannotCancel: -31007,
  cannotPerform: -31008,
  /** The custom range Payme reserves for account problems. */
  orderNotFound: -31050,
  orderNotPayable: -31051,
} as const;

/** Payme transaction states. */
export const PAYME_STATE = {
  created: 1,
  performed: 2,
  cancelledBeforePerform: -1,
  cancelledAfterPerform: -2,
} as const;

interface PaymeState {
  /** Payme's own transaction id. */
  transaction: string;
  state: number;
  createTime: number;
  performTime: number;
  cancelTime: number;
  reason: number | null;
}

function config() {
  const merchantId = process.env.PAYME_MERCHANT_ID?.trim();
  const key = process.env.PAYME_KEY?.trim();
  return { merchantId, key, configured: Boolean(merchantId && key) };
}

export function toTiyin(sum: number): number {
  return Math.round(sum * 100);
}

export function fromTiyin(tiyin: number): number {
  return Math.round(tiyin / 100);
}

/**
 * Checks the Basic credentials Payme sends on every call.
 *
 * Compared in constant time. The login is always "Paycom"; the password is the
 * merchant key, which is the only thing proving the caller is Payme, so a
 * length-leaking comparison here would be a real weakness rather than a
 * theoretical one.
 */
export function verifyPaymeAuth(header: string | null, key: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const expected = `Paycom:${key}`;
  const a = Buffer.from(decoded);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readState(raw: string | null): PaymeState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PaymeState>;
    if (typeof parsed.transaction !== "string") return null;
    return {
      transaction: parsed.transaction,
      state: Number(parsed.state ?? PAYME_STATE.created),
      createTime: Number(parsed.createTime ?? 0),
      performTime: Number(parsed.performTime ?? 0),
      cancelTime: Number(parsed.cancelTime ?? 0),
      reason: parsed.reason == null ? null : Number(parsed.reason),
    };
  } catch {
    return null;
  }
}

// ─── JSON-RPC ─────────────────────────────────────────────────────────────────

export interface RpcRequest {
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
}

type RpcResponse =
  | { jsonrpc: "2.0"; id: unknown; result: unknown }
  | {
      jsonrpc: "2.0";
      id: unknown;
      error: { code: number; message: Record<string, string>; data?: string };
    };

/**
 * Payme shows the `message` object to the merchant and sometimes to the payer,
 * so every error carries all three languages the cabinet expects.
 */
function rpcError(
  id: unknown,
  code: number,
  messages: { ru: string; uz: string; en: string },
  data?: string
): RpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message: messages, data } };
}

function rpcResult(id: unknown, result: unknown): RpcResponse {
  return { jsonrpc: "2.0", id, result };
}

const MESSAGES = {
  orderNotFound: {
    ru: "Заказ не найден",
    uz: "Buyurtma topilmadi",
    en: "Order not found",
  },
  orderNotPayable: {
    ru: "Заказ нельзя оплатить",
    uz: "Buyurtmani toʻlab boʻlmaydi",
    en: "Order cannot be paid",
  },
  wrongAmount: {
    ru: "Неверная сумма",
    uz: "Summa notoʻgʻri",
    en: "Incorrect amount",
  },
  notFound: {
    ru: "Транзакция не найдена",
    uz: "Tranzaksiya topilmadi",
    en: "Transaction not found",
  },
  cannotPerform: {
    ru: "Операция невозможна",
    uz: "Amalni bajarib boʻlmaydi",
    en: "Unable to perform operation",
  },
  cannotCancel: {
    ru: "Отмена невозможна",
    uz: "Bekor qilib boʻlmaydi",
    en: "Unable to cancel",
  },
  method: {
    ru: "Метод не найден",
    uz: "Metod topilmadi",
    en: "Method not found",
  },
  auth: {
    ru: "Недостаточно прав",
    uz: "Huquqlar yetarli emas",
    en: "Insufficient privilege",
  },
} as const;

/**
 * Handles one Merchant API call.
 *
 * Exported so the route is three lines and the protocol is testable without a
 * running server.
 */
export async function handlePaymeRpc(
  body: unknown,
  authHeader: string | null
): Promise<{ status: number; body: RpcResponse }> {
  const { key, configured } = config();
  const request = (body ?? {}) as RpcRequest;
  const id = request.id ?? null;

  if (!configured || !verifyPaymeAuth(authHeader, key!)) {
    // 200 with a JSON-RPC error, not 401: Payme reads the body, and a bare
    // HTTP status is reported in their cabinet as an unreachable endpoint.
    return {
      status: 200,
      body: rpcError(id, PAYME_ERRORS.insufficientPrivilege, MESSAGES.auth),
    };
  }

  const params = (request.params ?? {}) as Record<string, unknown>;

  switch (request.method) {
    case "CheckPerformTransaction":
      return { status: 200, body: await checkPerform(id, params) };
    case "CreateTransaction":
      return { status: 200, body: await createTransaction(id, params) };
    case "PerformTransaction":
      return { status: 200, body: await performTransaction(id, params) };
    case "CancelTransaction":
      return { status: 200, body: await cancelTransaction(id, params) };
    case "CheckTransaction":
      return { status: 200, body: await checkTransaction(id, params) };
    case "GetStatement":
      return { status: 200, body: await getStatement(id, params) };
    default:
      return {
        status: 200,
        body: rpcError(id, PAYME_ERRORS.methodNotFound, MESSAGES.method),
      };
  }
}

function accountOrderId(params: Record<string, unknown>): string | null {
  const account = params.account as Record<string, unknown> | undefined;
  const value = account?.[ACCOUNT_FIELD];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** The order a Payme call is about, with the amount we expect for it. */
async function resolveOrder(params: Record<string, unknown>) {
  const orderId = accountOrderId(params);
  if (!orderId) return { error: "notFound" as const };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      currency: true,
      region: true,
      paymentStatus: true,
      orderStatus: true,
    },
  });

  if (!order) return { error: "notFound" as const };
  // A Russian order can never be paid through an Uzbek provider, whatever the
  // request claims.
  if (order.region !== "UZ" || order.currency !== "UZS") {
    return { error: "notPayable" as const };
  }
  if (order.orderStatus === "cancelled") return { error: "notPayable" as const };
  if (order.paymentStatus === "paid") return { error: "notPayable" as const };

  return { order };
}

async function checkPerform(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const resolved = await resolveOrder(params);
  if (resolved.error === "notFound") {
    return rpcError(id, PAYME_ERRORS.orderNotFound, MESSAGES.orderNotFound, ACCOUNT_FIELD);
  }
  if (resolved.error === "notPayable") {
    return rpcError(id, PAYME_ERRORS.orderNotPayable, MESSAGES.orderNotPayable, ACCOUNT_FIELD);
  }

  const amount = Number(params.amount);
  if (amount !== toTiyin(resolved.order.total)) {
    return rpcError(id, PAYME_ERRORS.wrongAmount, MESSAGES.wrongAmount);
  }

  return rpcResult(id, { allow: true });
}

async function createTransaction(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const transactionId = String(params.id ?? "");
  const time = Number(params.time ?? Date.now());

  const existing = await db.payment.findUnique({
    where: { providerPaymentId: transactionId },
    select: { id: true, providerState: true, status: true },
  });

  if (existing) {
    const state = readState(existing.providerState);
    // Re-asking about a transaction we already created is normal and must
    // return the same answer. Any other state means it is over.
    if (state?.state === PAYME_STATE.created) {
      return rpcResult(id, {
        create_time: state.createTime,
        transaction: existing.id,
        state: state.state,
      });
    }
    return rpcError(id, PAYME_ERRORS.cannotPerform, MESSAGES.cannotPerform);
  }

  const resolved = await resolveOrder(params);
  if (resolved.error === "notFound") {
    return rpcError(id, PAYME_ERRORS.orderNotFound, MESSAGES.orderNotFound, ACCOUNT_FIELD);
  }
  if (resolved.error === "notPayable") {
    return rpcError(id, PAYME_ERRORS.orderNotPayable, MESSAGES.orderNotPayable, ACCOUNT_FIELD);
  }

  const amount = Number(params.amount);
  if (amount !== toTiyin(resolved.order.total)) {
    return rpcError(id, PAYME_ERRORS.wrongAmount, MESSAGES.wrongAmount);
  }

  // One unfinished Payme transaction per order. A second one would let the
  // same order be paid twice.
  const pending = await db.payment.findFirst({
    where: {
      orderId: resolved.order.id,
      provider: "payme",
      status: { in: ["pending", "waiting_for_capture"] },
      providerPaymentId: { not: null },
    },
    select: { id: true },
  });
  if (pending) {
    return rpcError(id, PAYME_ERRORS.cannotPerform, MESSAGES.cannotPerform);
  }

  const state: PaymeState = {
    transaction: transactionId,
    state: PAYME_STATE.created,
    createTime: time,
    performTime: 0,
    cancelTime: 0,
    reason: null,
  };

  // Attach to the row startPayment already made for this attempt when there is
  // one; create it otherwise, because a customer can return to a Payme link
  // long after the checkout session that produced it.
  const attachable = await db.payment.findFirst({
    where: {
      orderId: resolved.order.id,
      provider: "payme",
      providerPaymentId: null,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const payment = attachable
    ? await db.payment.update({
        where: { id: attachable.id },
        data: {
          providerPaymentId: transactionId,
          providerState: JSON.stringify(state),
          amount: resolved.order.total,
          currency: resolved.order.currency,
        },
        select: { id: true },
      })
    : await db.payment.create({
        data: {
          orderId: resolved.order.id,
          provider: "payme",
          providerPaymentId: transactionId,
          providerState: JSON.stringify(state),
          status: "pending",
          amount: resolved.order.total,
          currency: resolved.order.currency,
          idempotencyKey: `payme:${transactionId}`,
        },
        select: { id: true },
      });

  logger.info("payme.transaction_created", {
    orderId: resolved.order.id,
    paymentId: payment.id,
  });

  return rpcResult(id, {
    create_time: time,
    transaction: payment.id,
    state: PAYME_STATE.created,
  });
}

async function performTransaction(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const transactionId = String(params.id ?? "");
  const payment = await db.payment.findUnique({
    where: { providerPaymentId: transactionId },
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
    return rpcError(id, PAYME_ERRORS.transactionNotFound, MESSAGES.notFound);
  }

  if (state.state === PAYME_STATE.performed) {
    // Idempotent: Payme retries, and the second answer must equal the first.
    return rpcResult(id, {
      transaction: payment.id,
      perform_time: state.performTime,
      state: state.state,
    });
  }

  if (state.state !== PAYME_STATE.created) {
    return rpcError(id, PAYME_ERRORS.cannotPerform, MESSAGES.cannotPerform);
  }

  // Twelve hours is Payme's own limit; past it the transaction is dead and we
  // must say so rather than take the money.
  if (Date.now() - state.createTime > TRANSACTION_TTL_MS) {
    const cancelled: PaymeState = {
      ...state,
      state: PAYME_STATE.cancelledBeforePerform,
      cancelTime: Date.now(),
      reason: 4,
    };
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "canceled",
        failureReason: "Payme: истёк срок транзакции",
        providerState: JSON.stringify(cancelled),
      },
    });
    return rpcError(id, PAYME_ERRORS.cannotPerform, MESSAGES.cannotPerform);
  }

  const performTime = Date.now();
  const performed: PaymeState = { ...state, state: PAYME_STATE.performed, performTime };

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        paidAt: new Date(performTime),
        providerState: JSON.stringify(performed),
      },
    });
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "paid" },
    });
  });

  logger.info("payme.transaction_performed", {
    orderId: payment.orderId,
    paymentId: payment.id,
  });

  return rpcResult(id, {
    transaction: payment.id,
    perform_time: performTime,
    state: PAYME_STATE.performed,
  });
}

async function cancelTransaction(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const transactionId = String(params.id ?? "");
  const reason = params.reason == null ? null : Number(params.reason);

  const payment = await db.payment.findUnique({
    where: { providerPaymentId: transactionId },
    select: { id: true, orderId: true, providerState: true },
  });
  const state = readState(payment?.providerState ?? null);
  if (!payment || !state) {
    return rpcError(id, PAYME_ERRORS.transactionNotFound, MESSAGES.notFound);
  }

  if (state.state < 0) {
    return rpcResult(id, {
      transaction: payment.id,
      cancel_time: state.cancelTime,
      state: state.state,
    });
  }

  const wasPerformed = state.state === PAYME_STATE.performed;

  if (wasPerformed) {
    // Refusing to cancel a performed transaction once the book is in the post
    // is the whole point of -31007: the goods are gone and the money is not
    // ours to hand back automatically.
    const order = await db.order.findUnique({
      where: { id: payment.orderId },
      select: { orderStatus: true },
    });
    const dispatched = ["in_delivery", "completed"];
    if (order && dispatched.includes(order.orderStatus)) {
      return rpcError(id, PAYME_ERRORS.cannotCancel, MESSAGES.cannotCancel);
    }
  }

  const cancelTime = Date.now();
  const cancelled: PaymeState = {
    ...state,
    state: wasPerformed
      ? PAYME_STATE.cancelledAfterPerform
      : PAYME_STATE.cancelledBeforePerform,
    cancelTime,
    reason,
  };

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "canceled",
        failureReason: `Payme: отменено (reason ${reason ?? "—"})`,
        providerState: JSON.stringify(cancelled),
        paidAt: null,
      },
    });
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: wasPerformed ? "refunded" : "unpaid" },
    });
  });

  logger.info("payme.transaction_cancelled", {
    orderId: payment.orderId,
    paymentId: payment.id,
    wasPerformed,
  });

  return rpcResult(id, {
    transaction: payment.id,
    cancel_time: cancelTime,
    state: cancelled.state,
  });
}

async function checkTransaction(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const transactionId = String(params.id ?? "");
  const payment = await db.payment.findUnique({
    where: { providerPaymentId: transactionId },
    select: { id: true, providerState: true },
  });
  const state = readState(payment?.providerState ?? null);
  if (!payment || !state) {
    return rpcError(id, PAYME_ERRORS.transactionNotFound, MESSAGES.notFound);
  }

  return rpcResult(id, {
    create_time: state.createTime,
    perform_time: state.performTime,
    cancel_time: state.cancelTime,
    transaction: payment.id,
    state: state.state,
    reason: state.reason,
  });
}

async function getStatement(
  id: unknown,
  params: Record<string, unknown>
): Promise<RpcResponse> {
  const from = Number(params.from ?? 0);
  const to = Number(params.to ?? Date.now());

  const payments = await db.payment.findMany({
    where: {
      provider: "payme",
      providerPaymentId: { not: null },
      createdAt: { gte: new Date(from), lte: new Date(to) },
    },
    select: {
      id: true,
      orderId: true,
      amount: true,
      providerPaymentId: true,
      providerState: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const transactions = payments.flatMap((payment) => {
    const state = readState(payment.providerState);
    if (!state) return [];
    return [
      {
        id: payment.providerPaymentId,
        time: state.createTime,
        amount: toTiyin(payment.amount),
        account: { [ACCOUNT_FIELD]: payment.orderId },
        create_time: state.createTime,
        perform_time: state.performTime,
        cancel_time: state.cancelTime,
        transaction: payment.id,
        state: state.state,
        reason: state.reason,
      },
    ];
  });

  return rpcResult(id, { transactions });
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

export const paymeGateway: PaymentGateway = {
  id: "payme",

  isConfigured() {
    return config().configured;
  },

  /**
   * Builds the checkout link. No network call: with Payme the merchant does
   * not create anything, it hands the customer a URL and waits to be called.
   */
  async createPayment(
    input: CreatePaymentInput
  ): Promise<ProviderResult<CreatedPayment>> {
    const { merchantId, configured } = config();
    if (!configured) return { ok: false, error: "Payme не настроен" };

    const encoded = Buffer.from(
      [
        `m=${merchantId}`,
        `ac.${ACCOUNT_FIELD}=${input.orderId}`,
        `a=${toTiyin(input.amount)}`,
        `c=${input.returnUrl}`,
        "l=ru",
      ].join(";"),
      "utf8"
    ).toString("base64");

    return {
      ok: true,
      value: {
        // Payme mints the transaction id when it calls CreateTransaction; we
        // have nothing to record yet.
        providerPaymentId: null,
        status: "pending",
        confirmationUrl: `${CHECKOUT_URL}/${encoded}`,
      },
    };
  },

  /**
   * Payme never posts a webhook in the usual sense — it calls the Merchant API
   * above, which applies its own changes. This exists to satisfy the interface
   * and must never be reached.
   */
  async parseWebhook(): Promise<ProviderResult<ProviderEvent>> {
    return {
      ok: false,
      error: "Payme использует Merchant API, а не webhook",
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
