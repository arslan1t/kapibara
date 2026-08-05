import "server-only";

import type {
  CreatePaymentInput,
  CreatedPayment,
  PaymentGateway,
  ProviderEvent,
  ProviderResult,
} from "./types";

/**
 * Payment on confirmation — the provider-free default.
 *
 * This is not a stub or a simulation. It represents a real, common arrangement
 * for a small print shop: the order is placed, an administrator confirms it and
 * takes the money by invoice or on delivery, then marks it paid in the panel.
 *
 * What it deliberately does NOT do is claim money has been collected. The
 * payment sits at `pending` until a human records otherwise, and every customer
 * screen says so.
 */
export const manualGateway: PaymentGateway = {
  id: "manual",

  /** Always available: there is nothing to configure. */
  isConfigured() {
    return true;
  },

  async createPayment(
    input: CreatePaymentInput
  ): Promise<ProviderResult<CreatedPayment>> {
    return {
      ok: true,
      value: {
        // There is no external system, so the order number is the reference an
        // administrator uses when reconciling.
        providerPaymentId: `manual:${input.orderNumber}`,
        status: "pending",
        // No redirect — the customer goes straight to the confirmation page.
        confirmationUrl: null,
      },
    };
  },

  async parseWebhook(): Promise<ProviderResult<ProviderEvent>> {
    // Nothing calls us; accepting an unauthenticated "payment succeeded"
    // request here would be a way to mark any order paid for free.
    return { ok: false, error: "Провайдер не отправляет вебхуки" };
  },

  async fetchPayment(
    providerPaymentId: string
  ): Promise<ProviderResult<ProviderEvent>> {
    return {
      ok: true,
      value: {
        providerPaymentId,
        // The database is the authority for a manual payment; there is no
        // remote status to reconcile against.
        status: "pending",
        amount: null,
        raw: null,
      },
    };
  },
};
