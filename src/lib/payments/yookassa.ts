import "server-only";

import { timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatedPayment,
  PaymentGateway,
  ProviderEvent,
  ProviderResult,
} from "./types";
import type { PaymentAttemptStatus } from "@/lib/constants";

/**
 * YooKassa (ЮKassa) gateway.
 *
 * Complete against the provider's REST API — creation, webhook handling and
 * status reconciliation. The only thing missing is the shop id and secret key;
 * set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY and online payment turns on with
 * no code change.
 *
 * Docs: https://yookassa.ru/developers/api
 */

const API_BASE = "https://api.yookassa.ru/v3";

interface YooKassaConfig {
  shopId: string;
  secretKey: string;
  /**
   * Shared secret we generate ourselves and append to the notification URL.
   * YooKassa does not sign webhooks, so the documented protection is to keep
   * the notification URL unguessable and to re-read the payment from the API
   * before trusting it. We do both.
   */
  webhookSecret: string | null;
}

function readConfig(): YooKassaConfig | null {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) return null;

  return {
    shopId,
    secretKey,
    webhookSecret: process.env.YOOKASSA_WEBHOOK_SECRET?.trim() || null,
  };
}

function authHeader(config: YooKassaConfig): string {
  return `Basic ${Buffer.from(`${config.shopId}:${config.secretKey}`).toString("base64")}`;
}

/** Roubles → the provider's decimal string. */
function toAmountValue(roubles: number): string {
  return `${roubles}.00`;
}

/** The provider's decimal string → whole roubles, rounded defensively. */
function fromAmountValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Provider vocabulary → ours. Anything unrecognised is treated as failed. */
function mapStatus(status: unknown): PaymentAttemptStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "waiting_for_capture":
      return "waiting_for_capture";
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    default:
      return "failed";
  }
}

interface YooKassaPayment {
  id?: string;
  status?: string;
  amount?: { value?: string; currency?: string };
  confirmation?: { confirmation_url?: string };
  cancellation_details?: { reason?: string };
}

function toEvent(payment: YooKassaPayment, raw: unknown): ProviderResult<ProviderEvent> {
  if (!payment.id) return { ok: false, error: "Ответ без идентификатора платежа" };

  return {
    ok: true,
    value: {
      providerPaymentId: payment.id,
      status: mapStatus(payment.status),
      amount: fromAmountValue(payment.amount?.value),
      failureReason: payment.cancellation_details?.reason,
      raw,
    },
  };
}

async function request(
  config: YooKassaConfig,
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<ProviderResult<unknown>> {
  const { idempotencyKey, ...rest } = init;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Authorization: authHeader(config),
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotence-Key": idempotencyKey } : {}),
        ...rest.headers,
      },
      // A hung acquirer must not hold a checkout request open indefinitely.
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      // Provider wording is kept for the operator; callers map this to a
      // generic Russian message before it reaches a customer.
      const description =
        (body as { description?: string } | null)?.description ??
        `HTTP ${response.status}`;
      return { ok: false, error: description };
    }

    return { ok: true, value: body };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Сетевая ошибка",
    };
  }
}

export const yookassaGateway: PaymentGateway = {
  id: "yookassa",

  isConfigured() {
    return readConfig() !== null;
  },

  async createPayment(
    input: CreatePaymentInput
  ): Promise<ProviderResult<CreatedPayment>> {
    const config = readConfig();
    if (!config) return { ok: false, error: "Провайдер оплаты не настроен" };

    const result = await request(config, "/payments", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: JSON.stringify({
        amount: { value: toAmountValue(input.amount), currency: "RUB" },
        // Capture immediately: this shop has no two-stage holds.
        capture: true,
        confirmation: { type: "redirect", return_url: input.returnUrl },
        description: input.description,
        metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
        receipt: {
          customer: { email: input.customerEmail },
          items: [
            {
              description: input.description.slice(0, 128),
              quantity: "1.00",
              amount: { value: toAmountValue(input.amount), currency: "RUB" },
              vat_code: 1,
              payment_mode: "full_prepayment",
              payment_subject: "commodity",
            },
          ],
        },
      }),
    });

    if (!result.ok) return result;

    const payment = result.value as YooKassaPayment;
    if (!payment.id) return { ok: false, error: "Провайдер не вернул платёж" };

    return {
      ok: true,
      value: {
        providerPaymentId: payment.id,
        status: mapStatus(payment.status),
        confirmationUrl: payment.confirmation?.confirmation_url ?? null,
        raw: payment,
      },
    };
  },

  async parseWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<ProviderResult<ProviderEvent>> {
    const config = readConfig();
    if (!config) return { ok: false, error: "Провайдер оплаты не настроен" };

    // Optional shared secret. When set, a request without it is rejected
    // before anything is parsed.
    if (config.webhookSecret) {
      const provided = headers.get("x-webhook-secret") ?? "";
      const a = Buffer.from(provided);
      const b = Buffer.from(config.webhookSecret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return { ok: false, error: "Неверный секрет вебхука" };
      }
    }

    let parsed: { event?: string; object?: YooKassaPayment };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { ok: false, error: "Некорректный JSON" };
    }

    const id = parsed.object?.id;
    if (!id) return { ok: false, error: "Событие без идентификатора платежа" };

    // The webhook body is only a hint about *which* payment changed. The
    // authoritative status is re-read from the API, so a forged request cannot
    // mark an order paid even if it reaches this endpoint.
    return this.fetchPayment(id);
  },

  async fetchPayment(
    providerPaymentId: string
  ): Promise<ProviderResult<ProviderEvent>> {
    const config = readConfig();
    if (!config) return { ok: false, error: "Провайдер оплаты не настроен" };

    const result = await request(
      config,
      `/payments/${encodeURIComponent(providerPaymentId)}`
    );
    if (!result.ok) return result;

    return toEvent(result.value as YooKassaPayment, result.value);
  },
};
