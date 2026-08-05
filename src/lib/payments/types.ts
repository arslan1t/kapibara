import type { PaymentAttemptStatus, PaymentProvider } from "@/lib/constants";

/**
 * The contract every payment provider implements.
 *
 * Keeping this narrow is the point: the order code below never learns which
 * provider it is talking to, so adding a second one — or swapping YooKassa for
 * a different acquirer — touches only this folder.
 */
export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  /** Whole roubles. Always the server-computed order total. */
  amount: number;
  description: string;
  customerEmail: string;
  /** Where the provider sends the customer once they are done. */
  returnUrl: string;
  /** Our own key, replayed to the provider so a retry cannot double-charge. */
  idempotencyKey: string;
}

export interface CreatedPayment {
  /** The provider's identifier, stored so webhooks can find the order. */
  providerPaymentId: string | null;
  status: PaymentAttemptStatus;
  /** Null when the provider needs no redirect (the manual provider). */
  confirmationUrl: string | null;
  raw?: unknown;
}

export interface ProviderEvent {
  providerPaymentId: string;
  status: PaymentAttemptStatus;
  /** Whole roubles, as the provider reports it. Checked against our record. */
  amount: number | null;
  failureReason?: string;
  raw: unknown;
}

export type ProviderResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface PaymentGateway {
  readonly id: PaymentProvider;
  /** False when credentials are absent — the gateway is then never offered. */
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<ProviderResult<CreatedPayment>>;
  /**
   * Verifies an incoming webhook and normalises it.
   *
   * Returning an error here means the request is not provably from the
   * provider and must be ignored, never applied.
   */
  parseWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<ProviderResult<ProviderEvent>>;
  /** Re-reads the authoritative status, used to reconcile a stale payment. */
  fetchPayment(providerPaymentId: string): Promise<ProviderResult<ProviderEvent>>;
}
